import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { ORDER_LOCK_RULES, ORDER_EXPIRY_MINUTES } from "@/lib/config/constants";
import { computeDeliveryCharge } from "@/lib/cart";

type Tx = Prisma.TransactionClient | PrismaClient;
type Role = keyof typeof ORDER_LOCK_RULES;

export class OrderRuleError extends Error {}

export function orderExpiryDate(from = new Date()) {
  return new Date(from.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);
}

/** Money the parent has paid and not been (or about to be) refunded. */
export async function netPaid(tx: Tx, order: { id: number; amount_paid: number }) {
  const pending = await tx.refund.aggregate({
    where: { order_id: order.id, status: "pending" },
    _sum: { amount: true },
  });
  return order.amount_paid - (pending._sum.amount || 0);
}

/** Positive: parent owes this much. Negative: parent is owed a refund. */
export async function orderBalance(tx: Tx, order: { id: number; amount_paid: number; grand_total: number }) {
  return order.grand_total - (await netPaid(tx, order));
}

function hasTakenStock(paymentStatus: string) {
  // Stock is taken when the first payment succeeds and returned on cancel.
  return paymentStatus === "paid" || paymentStatus === "partial_refund";
}

/**
 * Cancels an order: returns stock, queues a refund for whatever was paid and records history.
 * Callers check permissions and lock rules first.
 */
export async function cancelOrder(
  tx: Tx,
  orderId: number,
  actor: { label: string; role: string },
  reason: string
) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.order_status === "cancelled") return order;

  if (hasTakenStock(order.payment_status)) {
    for (const item of order.items) {
      if (!item.variant_id) continue;
      await tx.schoolProductVariant.update({
        where: { id: item.variant_id },
        data: { stock: { increment: item.qty } },
      });
    }
  }

  const refundable = await netPaid(tx, order);
  if (refundable > 0) {
    await tx.refund.create({
      data: {
        order_id: order.id,
        amount: refundable,
        reason,
        status: "pending",
        processed_by: actor.label,
      },
    });
  }

  return tx.order.update({
    where: { id: order.id },
    data: {
      order_status: "cancelled",
      ...(order.payment_status === "pending" ? { payment_status: "failed" } : {}),
      statusHistory: { create: { status: "cancelled", changed_by: actor.label, note: reason } },
    },
  });
}

export interface ItemChange {
  order_item_id: number;
  /** Another size of the same school product */
  variant_id?: number;
  qty?: number;
}

/**
 * Applies size/quantity changes to a paid order: swaps stock between sizes, reprices,
 * recalculates delivery and either leaves a balance to pay or queues a refund.
 */
export async function applyItemChanges(
  orderId: number,
  changes: ItemChange[],
  actor: { label: string; role: Role },
  reason: string
) {
  if (!changes.length) throw new OrderRuleError("No changes to apply");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, school: true },
    });

    if (order.payment_status === "pending" || order.order_status === "pending_payment") {
      throw new OrderRuleError("This order hasn't been paid yet");
    }
    const editable = ORDER_LOCK_RULES[actor.role].editItemsUntil as readonly string[];
    if (!editable.includes(order.order_status)) {
      throw new OrderRuleError(`Items can't be changed once an order is ${order.order_status.replace(/_/g, " ")}`);
    }

    const oldItems = order.items.map((it) => ({ ...it }));

    for (const change of changes) {
      const item = order.items.find((it) => it.id === Number(change.order_item_id));
      if (!item) throw new OrderRuleError("Item not found on this order");

      const newQty = change.qty === undefined ? item.qty : Number(change.qty);
      if (!Number.isInteger(newQty) || newQty < 1 || newQty > 20) throw new OrderRuleError("Invalid quantity");

      let newVariant = item.variant_id
        ? await tx.schoolProductVariant.findUnique({ where: { id: item.variant_id }, include: { size: true, schoolProduct: true } })
        : null;
      if (change.variant_id && Number(change.variant_id) !== item.variant_id) {
        const candidate = await tx.schoolProductVariant.findUnique({
          where: { id: Number(change.variant_id) },
          include: { size: true, schoolProduct: true },
        });
        if (!candidate || !newVariant || candidate.school_product_id !== newVariant.school_product_id) {
          throw new OrderRuleError("You can only switch to another size of the same item");
        }
        newVariant = candidate;
      }
      if (!newVariant) throw new OrderRuleError(`${item.item_name} is no longer sold, so it can't be changed`);

      // Return the old pieces, then take the new ones (fails if not enough stock).
      if (item.variant_id) {
        await tx.schoolProductVariant.update({ where: { id: item.variant_id }, data: { stock: { increment: item.qty } } });
      }
      const taken = await tx.schoolProductVariant.updateMany({
        where: { id: newVariant.id, stock: { gte: newQty } },
        data: { stock: { decrement: newQty } },
      });
      if (taken.count === 0) {
        throw new OrderRuleError(`Not enough stock for ${item.item_name} in size ${newVariant.size.size_label}`);
      }

      const keepPrice = newVariant.id === item.variant_id;
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          variant_id: newVariant.id,
          size: newVariant.size.size_label,
          qty: newQty,
          // Same size keeps the price the parent paid; a new size uses its current price.
          unit_price: keepPrice ? item.unit_price : newVariant.price,
        },
      });
    }

    const newItems = await tx.orderItem.findMany({ where: { order_id: order.id } });
    const itemsTotal = newItems.reduce((sum, it) => sum + it.unit_price * it.qty, 0);
    const deliveryCharge = computeDeliveryCharge(order.school, itemsTotal);
    const grandTotal = itemsTotal + deliveryCharge;

    await tx.orderEditHistory.create({
      data: {
        order_id: order.id,
        edited_by: actor.label,
        role: actor.role,
        reason,
        old_data: { items: oldItems, items_total: order.items_total, grand_total: order.grand_total } as Prisma.InputJsonValue,
        new_data: { items: newItems, items_total: itemsTotal, grand_total: grandTotal } as Prisma.InputJsonValue,
      },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        items_total: itemsTotal,
        delivery_charge: deliveryCharge,
        grand_total: grandTotal,
        edited_count: { increment: 1 },
        statusHistory: {
          create: { status: order.order_status, changed_by: actor.label, note: `Items changed: ${reason}` },
        },
      },
      include: { items: true },
    });

    let balance = await orderBalance(tx, updated);
    if (balance > 0) {
      // Cheaper earlier edit followed by a dearer one: shrink refunds that haven't gone out yet.
      const pending = await tx.refund.findMany({ where: { order_id: order.id, status: "pending" }, orderBy: { createdAt: "desc" } });
      for (const r of pending) {
        if (balance <= 0) break;
        const cut = Math.min(r.amount, balance);
        if (cut === r.amount) await tx.refund.delete({ where: { id: r.id } });
        else await tx.refund.update({ where: { id: r.id }, data: { amount: r.amount - cut } });
        balance -= cut;
      }
    } else if (balance < 0) {
      await tx.refund.create({
        data: {
          order_id: order.id,
          amount: -balance,
          reason: `Price difference after change: ${reason}`,
          status: "pending",
          processed_by: actor.label,
        },
      });
      balance = 0;
    }

    return { order: updated, balanceDue: Math.max(balance, 0), priceDiff: grandTotal - order.grand_total };
  });
}

/**
 * Unpaid checkouts hold nothing (stock is taken on payment) but clutter the parent's list.
 * After ORDER_EXPIRY_MINUTES they're cancelled and their items go back into the child's bag.
 */
export async function expireStaleOrders(where: Prisma.OrderWhereInput = {}) {
  const stale = await prisma.order.findMany({
    where: { ...where, order_status: "pending_payment", expires_at: { lt: new Date() } },
    include: { items: true },
    take: 200,
  });

  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      // Guard against a payment completing at the same moment
      const claimed = await tx.order.updateMany({
        where: { id: order.id, order_status: "pending_payment" },
        data: { order_status: "cancelled", payment_status: "failed" },
      });
      if (claimed.count === 0) return;

      await tx.orderStatusHistory.create({
        data: { order_id: order.id, status: "cancelled", changed_by: "System", note: "Payment not completed in time; items returned to bag" },
      });
      await tx.payment.updateMany({ where: { order_id: order.id, status: "created" }, data: { status: "expired" } });

      let cart = await tx.cart.findFirst({ where: { parent_id: order.parent_id, student_id: order.student_id } });
      if (!cart) cart = await tx.cart.create({ data: { parent_id: order.parent_id, student_id: order.student_id } });
      for (const item of order.items) {
        if (!item.variant_id) continue;
        const existing = await tx.cartItem.findFirst({ where: { cart_id: cart.id, variant_id: item.variant_id } });
        if (existing) {
          await tx.cartItem.update({ where: { id: existing.id }, data: { qty: Math.max(existing.qty, item.qty) } });
        } else {
          await tx.cartItem.create({ data: { cart_id: cart.id, variant_id: item.variant_id, qty: item.qty } });
        }
      }
    });
  }
  return stale.length;
}

export function isExpired(order: { order_status: string; expires_at: Date | null }) {
  return order.order_status === "pending_payment" && !!order.expires_at && order.expires_at < new Date();
}

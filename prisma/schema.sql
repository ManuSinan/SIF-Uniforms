-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `role` ENUM('super_admin', 'school_admin', 'parent') NOT NULL,
    `school_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_mobile_key`(`mobile`),
    INDEX `users_school_id_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schools` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `primary_color` VARCHAR(191) NOT NULL DEFAULT '#1e3a8a',
    `secondary_color` VARCHAR(191) NOT NULL DEFAULT '#fbbf24',
    `address` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `delivery_charge` INTEGER NOT NULL DEFAULT 0,
    `free_delivery_above` INTEGER NULL,
    `allow_admin_price_stock_edit` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `schools_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_serviceable_pincodes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `school_id` INTEGER NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `school_serviceable_pincodes_school_id_idx`(`school_id`),
    INDEX `school_serviceable_pincodes_pincode_idx`(`pincode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile` VARCHAR(191) NOT NULL,
    `otp_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_requests_mobile_idx`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NOT NULL,
    `school_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `class` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NULL,
    `admission_no` VARCHAR(191) NULL,
    `gender` ENUM('boys', 'girls', 'all') NOT NULL DEFAULT 'all',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `students_parent_id_idx`(`parent_id`),
    INDEX `students_school_id_idx`(`school_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `line1` VARCHAR(191) NOT NULL,
    `line2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `landmark` VARCHAR(191) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `addresses_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `size_chart_text` VARCHAR(191) NULL,
    `size_chart_image_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_sizes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `size_label` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_sizes_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `school_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `color_name` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `gender` ENUM('boys', 'girls', 'all') NOT NULL DEFAULT 'all',
    `class_from` VARCHAR(191) NOT NULL,
    `class_to` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `school_products_school_id_idx`(`school_id`),
    INDEX `school_products_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_product_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `school_product_id` INTEGER NOT NULL,
    `size_id` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `reserved_stock` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `school_product_variants_school_product_id_idx`(`school_product_id`),
    INDEX `school_product_variants_size_id_idx`(`size_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NOT NULL,
    `student_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `carts_parent_id_idx`(`parent_id`),
    INDEX `carts_student_id_idx`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cart_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cart_items_cart_id_idx`(`cart_id`),
    INDEX `cart_items_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(191) NOT NULL,
    `parent_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `school_id` INTEGER NOT NULL,
    `address_id` INTEGER NULL,
    `address_snapshot` JSON NOT NULL,
    `items_total` INTEGER NOT NULL,
    `delivery_charge` INTEGER NOT NULL,
    `grand_total` INTEGER NOT NULL,
    `amount_paid` INTEGER NOT NULL DEFAULT 0,
    `payment_status` ENUM('pending', 'paid', 'partial_refund', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
    `order_status` ENUM('pending_payment', 'placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending_payment',
    `tracking_token` VARCHAR(191) NOT NULL,
    `courier_name` VARCHAR(191) NULL,
    `courier_phone` VARCHAR(191) NULL,
    `courier_tracking_no` VARCHAR(191) NULL,
    `delivery_note` VARCHAR(191) NULL,
    `delivery_proof_url` VARCHAR(191) NULL,
    `edited_count` INTEGER NOT NULL DEFAULT 0,
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `pending_edit` JSON NULL,
    `expires_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `delete_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_no_key`(`order_no`),
    UNIQUE INDEX `orders_tracking_token_key`(`tracking_token`),
    INDEX `orders_school_id_idx`(`school_id`),
    INDEX `orders_parent_id_idx`(`parent_id`),
    INDEX `orders_student_id_idx`(`student_id`),
    INDEX `orders_order_no_idx`(`order_no`),
    INDEX `orders_tracking_token_idx`(`tracking_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `variant_id` INTEGER NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL,
    `unit_price` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `razorpay_order_id` VARCHAR(191) NOT NULL,
    `razorpay_payment_id` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `type` ENUM('initial', 'extra') NOT NULL DEFAULT 'initial',
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payments_order_id_idx`(`order_id`),
    INDEX `payments_razorpay_order_id_idx`(`razorpay_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refunds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `razorpay_refund_id` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `status` ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
    `processed_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `refunds_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `changed_by` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_status_history_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_edit_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `edited_by` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `old_data` JSON NOT NULL,
    `new_data` JSON NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_edit_history_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `change_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `parent_id` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `handled_by` VARCHAR(191) NULL,
    `response_note` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `change_requests_order_id_idx`(`order_id`),
    INDEX `change_requests_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `webhook_events_event_id_key`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NULL,
    `details` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_entity_entity_id_idx`(`entity`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mobile` VARCHAR(191) NOT NULL,
    `template` VARCHAR(191) NOT NULL,
    `order_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `provider_message_id` VARCHAR(191) NULL,
    `error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `whatsapp_log_mobile_idx`(`mobile`),
    INDEX `whatsapp_log_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_serviceable_pincodes` ADD CONSTRAINT `school_serviceable_pincodes_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_sizes` ADD CONSTRAINT `product_sizes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_products` ADD CONSTRAINT `school_products_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_products` ADD CONSTRAINT `school_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_product_variants` ADD CONSTRAINT `school_product_variants_school_product_id_fkey` FOREIGN KEY (`school_product_id`) REFERENCES `school_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_product_variants` ADD CONSTRAINT `school_product_variants_size_id_fkey` FOREIGN KEY (`size_id`) REFERENCES `product_sizes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `school_product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_school_id_fkey` FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `school_product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_edit_history` ADD CONSTRAINT `order_edit_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `change_requests` ADD CONSTRAINT `change_requests_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `change_requests` ADD CONSTRAINT `change_requests_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


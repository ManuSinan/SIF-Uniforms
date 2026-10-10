import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "schools";

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    // Validate mime type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type '${file.type}'. Allowed: JPG, PNG, WEBP, SVG.` },
        { status: 400 }
      );
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image file size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // Determine target upload folder inside public
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    // Sanitize file extension
    const ext = path.extname(file.name) || (file.type === "image/svg+xml" ? ".svg" : ".png");
    const sanitizedBase = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    const filename = `${sanitizedBase}-${uniqueSuffix}${ext}`;

    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

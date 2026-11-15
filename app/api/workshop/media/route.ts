import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No media file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "workshop");
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
    const safeName = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const fullPath = path.join(uploadDir, safeName);

    await fs.writeFile(fullPath, buffer);

    return NextResponse.json({
      url: `/uploads/workshop/${safeName}`,
      type: file.type.startsWith("video/") ? "video" : "photo",
    });
  } catch (error) {
    console.error("Workshop media upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

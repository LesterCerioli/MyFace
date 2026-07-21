import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";

const PUBLIC_URL_BASE = process.env.LOCALSTACK_ENDPOINT!;

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop() || "bin";
    const key = `uploads/${userId}/${uuidv4()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${PUBLIC_URL_BASE}/${S3_BUCKET}/${key}`;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    return NextResponse.json({
      success: true,
      data: {
        publicUrl,
        key,
        mediaType,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

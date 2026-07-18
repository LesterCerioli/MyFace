import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    const extension = fileName.split(".").pop() || "bin";
    const key = `uploads/${userId}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    const publicUrl = `${PUBLIC_URL_BASE}/${S3_BUCKET}/${key}`;
    const mediaType = contentType.startsWith("video/") ? "video" : "image";

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
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

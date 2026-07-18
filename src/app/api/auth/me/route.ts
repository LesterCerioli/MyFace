import { NextResponse } from "next/server";
import { docClient } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: "MyFaceUsers",
        Key: { userId },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { passwordHash, ...user } = result.Item;
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

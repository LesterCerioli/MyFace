import { NextRequest, NextResponse } from "next/server";
import { docClient } from "@/lib/aws";
import { hashPassword } from "@/lib/auth";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, confirmPassword } = await request.json();

    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Email, new password, and confirm password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "MyFaceUsers",
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No account found with this email" },
        { status: 404 }
      );
    }

    const user = result.Items[0];
    const passwordHash = hashPassword(newPassword);

    await docClient.send(
      new UpdateCommand({
        TableName: "MyFaceUsers",
        Key: { userId: user.userId },
        UpdateExpression: "SET passwordHash = :hash",
        ExpressionAttributeValues: {
          ":hash": passwordHash,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: { message: "Password updated successfully" },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

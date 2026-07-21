import { NextRequest, NextResponse } from "next/server";
import { docClient } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { displayName, bio, avatarUrl } = await request.json();
    const updateFields: Record<string, string> = {};

    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Display name cannot be empty" },
          { status: 400 }
        );
      }
      updateFields.displayName = displayName.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return NextResponse.json(
          { success: false, error: "Bio must be a string" },
          { status: 400 }
        );
      }
      updateFields.bio = bio;
    }

    if (avatarUrl !== undefined) {
      if (typeof avatarUrl !== "string") {
        return NextResponse.json(
          { success: false, error: "Avatar URL must be a string" },
          { status: 400 }
        );
      }
      updateFields.avatarUrl = avatarUrl;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const setExpression = Object.keys(updateFields)
      .map((key) => `#${key} = :${key}`)
      .join(", ");

    const expressionAttributeNames = Object.keys(updateFields).reduce(
      (acc, key) => ({ ...acc, [`#${key}`]: key }),
      {} as Record<string, string>
    );

    const expressionAttributeValues = Object.entries(updateFields).reduce(
      (acc, [key, value]) => ({ ...acc, [`:${key}`]: value }),
      {} as Record<string, string>
    );

    await docClient.send(
      new UpdateCommand({
        TableName: "MyFaceUsers",
        Key: { userId },
        UpdateExpression: `SET ${setExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    return NextResponse.json({
      success: true,
      data: updateFields,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

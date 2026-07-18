import { NextRequest, NextResponse } from "next/server";
import { docClient } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const postResult = await docClient.send(
      new GetCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
      })
    );

    if (!postResult.Item) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    const existingLike = await docClient.send(
      new GetCommand({
        TableName: "MyFaceLikes",
        Key: { postId: id, userId },
      })
    );

    if (existingLike.Item) {
      await docClient.send(
        new DeleteCommand({
          TableName: "MyFaceLikes",
          Key: { postId: id, userId },
        })
      );

      await docClient.send(
        new UpdateCommand({
          TableName: "MyFacePosts",
          Key: { postId: id },
          UpdateExpression: "ADD likeCount :minusOne",
          ExpressionAttributeValues: {
            ":minusOne": -1,
          },
        })
      );

      return NextResponse.json({ success: true, data: { liked: false } });
    }

    await docClient.send(
      new PutCommand({
        TableName: "MyFaceLikes",
        Item: {
          postId: id,
          userId,
          username: postResult.Item.username,
          createdAt: new Date().toISOString(),
        },
      })
    );

    await docClient.send(
      new UpdateCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
        UpdateExpression: "ADD likeCount :plusOne",
        ExpressionAttributeValues: {
          ":plusOne": 1,
        },
      })
    );

    return NextResponse.json({ success: true, data: { liked: true } });
  } catch (error) {
    console.error("Like toggle error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

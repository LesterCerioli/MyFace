import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await docClient.send(
      new QueryCommand({
        TableName: "MyFaceComments",
        IndexName: "PostIdCreatedAtIndex",
        KeyConditionExpression: "postId = :postId",
        ExpressionAttributeValues: {
          ":postId": id,
        },
        ScanIndexForward: false,
      })
    );

    return NextResponse.json({
      success: true,
      data: result.Items || [],
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "Comment text is required" },
        { status: 400 }
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

    const userResult = await docClient.send(
      new GetCommand({
        TableName: "MyFaceUsers",
        Key: { userId },
      })
    );

    const commentId = uuidv4();
    const comment = {
      commentId,
      postId: id,
      userId,
      username: userResult.Item?.username || "unknown",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: "MyFaceComments",
        Item: comment,
      })
    );

    await docClient.send(
      new UpdateCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
        UpdateExpression: "ADD commentCount :plusOne",
        ExpressionAttributeValues: {
          ":plusOne": 1,
        },
      })
    );

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

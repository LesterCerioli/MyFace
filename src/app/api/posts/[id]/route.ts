import { NextRequest, NextResponse } from "next/server";
import { docClient } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";
import { GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserIdFromCookie();

    const result = await docClient.send(
      new GetCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    let likedByMe = false;
    if (userId) {
      const likeResult = await docClient.send(
        new GetCommand({
          TableName: "MyFaceLikes",
          Key: { postId: id, userId },
        })
      );
      likedByMe = !!likeResult.Item;
    }

    return NextResponse.json({
      success: true,
      data: { ...result.Item, likedByMe },
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const result = await docClient.send(
      new GetCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (result.Item.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Post text cannot be empty" },
        { status: 400 }
      );
    }

    await docClient.send(
      new UpdateCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
        UpdateExpression: "SET #text = :text",
        ExpressionAttributeNames: { "#text": "text" },
        ExpressionAttributeValues: { ":text": text.trim() },
      })
    );

    return NextResponse.json({
      success: true,
      data: { postId: id, text: text.trim() },
    });
  } catch (error) {
    console.error("Edit post error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const result = await docClient.send(
      new GetCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (result.Item.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }

    await docClient.send(
      new DeleteCommand({
        TableName: "MyFacePosts",
        Key: { postId: id },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

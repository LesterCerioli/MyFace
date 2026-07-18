import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "@/lib/aws";
import { getUserIdFromCookie } from "@/lib/auth";
import { PutCommand, QueryCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const lastKey = searchParams.get("lastKey");

    let result;
    if (authorId) {
      result = await docClient.send(
        new QueryCommand({
          TableName: "MyFacePosts",
          IndexName: "UserIdCreatedAtIndex",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": authorId,
          },
          Limit: limit,
          ScanIndexForward: false,
          ...(lastKey && {
            ExclusiveStartKey: JSON.parse(decodeURIComponent(lastKey)),
          }),
        })
      );
    } else {
      result = await docClient.send(
        new ScanCommand({
          TableName: "MyFacePosts",
          Limit: limit,
          ...(lastKey && {
            ExclusiveStartKey: JSON.parse(decodeURIComponent(lastKey)),
          }),
        })
      );
    }

    let posts = result.Items || [];

    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (userId) {
      const likeChecks = await Promise.all(
        posts.map((post) =>
          docClient.send(
            new GetCommand({
              TableName: "MyFaceLikes",
              Key: { postId: post.postId, userId },
            })
          )
        )
      );
      posts = posts.map((post, i) => ({
        ...post,
        likedByMe: !!likeChecks[i].Item,
      }));
    }

    const lastEvaluatedKey = result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;

    return NextResponse.json({
      success: true,
      data: { posts, lastKey: lastEvaluatedKey },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { text, mediaUrls, mediaTypes } = await request.json();

    if (!text && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Post must have text or media" },
        { status: 400 }
      );
    }

    const userResult = await docClient.send(
      new GetCommand({
        TableName: "MyFaceUsers",
        Key: { userId },
      })
    );

    if (!userResult.Item) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const postId = uuidv4();
    const post = {
      postId,
      userId,
      username: userResult.Item.username,
      text: text || "",
      mediaUrls: mediaUrls || [],
      mediaTypes: mediaTypes || [],
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: "MyFacePosts",
        Item: post,
      })
    );

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

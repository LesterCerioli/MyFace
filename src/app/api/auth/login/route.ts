import { NextRequest, NextResponse } from "next/server";
import { docClient } from "@/lib/aws";
import { verifyPassword, createSession } from "@/lib/auth";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "MyFaceUsers",
        IndexName: "UsernameIndex",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": username,
        },
      })
    );

    const user = result.Items?.[0];
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const sessionToken = await createSession(user.userId);

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      },
    });

    response.cookies.set("myface_session", sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

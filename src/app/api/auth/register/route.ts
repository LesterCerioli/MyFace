import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "@/lib/aws";
import { hashPassword, createSession } from "@/lib/auth";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, displayName } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUsername = await docClient.send(
      new QueryCommand({
        TableName: "MyFaceUsers",
        IndexName: "UsernameIndex",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: { ":username": username },
      })
    );
    if (existingUsername.Items?.length) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    const existingEmail = await docClient.send(
      new QueryCommand({
        TableName: "MyFaceUsers",
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );
    if (existingEmail.Items?.length) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const userId = uuidv4();
    const passwordHash = hashPassword(password);

    await docClient.send(
      new PutCommand({
        TableName: "MyFaceUsers",
        Item: {
          userId,
          username,
          email,
          passwordHash,
          displayName: displayName || username,
          bio: "",
          avatarUrl: "",
          createdAt: new Date().toISOString(),
        },
        ConditionExpression: "attribute_not_exists(userId)",
      })
    );

    const sessionToken = await createSession(userId);

    const response = NextResponse.json({
      success: true,
      data: {
        userId,
        username,
        email,
        displayName: displayName || username,
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
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

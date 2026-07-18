import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "./aws";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const SESSION_SECRET = process.env.SESSION_SECRET || "myface-secret-key-change-in-production";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const derivedHash = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(derivedHash));
  } catch {
    return false;
  }
}

async function createSession(userId: string): Promise<string> {
  const sessionToken = uuidv4();
  await docClient.send(
    new PutCommand({
      TableName: "MyFaceSessions",
      Item: {
        sessionToken,
        userId,
        createdAt: new Date().toISOString(),
      },
    })
  );
  return sessionToken;
}

async function destroySession(sessionToken: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: "MyFaceSessions",
      Key: { sessionToken },
    })
  );
}

async function getSessionUserId(sessionToken: string): Promise<string | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: "MyFaceSessions",
        Key: { sessionToken },
      })
    );
    return (result.Item?.userId as string) || null;
  } catch {
    return null;
  }
}

async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("myface_session")?.value;
  if (!sessionToken) return null;
  return getSessionUserId(sessionToken);
}

function generateToken(): string {
  return uuidv4();
}

export {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getSessionUserId,
  getUserIdFromCookie,
  generateToken,
};

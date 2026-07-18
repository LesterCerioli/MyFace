import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("myface_session")?.value;

    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("myface_session", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

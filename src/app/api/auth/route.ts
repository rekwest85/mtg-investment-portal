import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = "mtg-portal-2026";
const JWT_SECRET = "mtg-portal-secret-key-2026";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const { password } = await request.json();

  if (password === ADMIN_PASSWORD) {
    cookieStore.set("session", "authenticated", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: "Invalid password" },
    { status: 401 }
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  return NextResponse.json({
    authenticated: session?.value === "authenticated",
  });
}

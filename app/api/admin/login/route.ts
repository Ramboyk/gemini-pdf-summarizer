import { NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DURATION_SECONDS,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Geçersiz istek gövdesi." },
        { status: 400 }
      );
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const isValid = verifyAdminCredentials(String(username), String(password));

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Geçersiz kullanıcı adı veya şifre." },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken();
    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Giriş işlemi sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}

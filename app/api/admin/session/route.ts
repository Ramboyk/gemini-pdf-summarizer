import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const authenticated = await isAdminSession(request);
  return NextResponse.json({ authenticated });
}

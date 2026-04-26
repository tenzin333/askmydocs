import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/chat"]
const authRoutes = ["/login", "/register"]

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token") ?? null;

    const path = req.nextUrl.pathname;

    const isProtected = protectedRoutes.some(route => path.startsWith(route))

    if (isProtected && !token){
      return NextResponse.redirect("/login")
    }

    const isAuthenticated = authRoutes.some(route => path.startsWith(route))

    if (isAuthenticated && token){
      return NextResponse.redirect("/dashboard")
    }

    return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
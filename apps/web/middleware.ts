import NextAuth, { type NextAuthResult } from "next-auth"

import { authConfig } from "@/auth.config"

const nextAuthInstance: NextAuthResult = NextAuth(authConfig)

export const middleware: NextAuthResult["auth"] = nextAuthInstance.auth

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)"]
}

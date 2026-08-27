import NextAuth, { type NextAuthResult } from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authService, ensureBackendSeeded, UnauthorizedError } from "@workspace/backend"
import { loginRequestSchema } from "@workspace/backend/lib/validators/auth"

const nextAuthInstance: NextAuthResult = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginRequestSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        await ensureBackendSeeded()

        try {
          const { user } = await authService.login(parsed.data)
          return { id: user.id, name: user.name, email: user.email, role: user.role }
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            return null
          }
          throw error
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isPublicPath = pathname === "/" || pathname.startsWith("/login")

      if (!auth?.user && !isPublicPath) {
        return false
      }

      if (auth?.user && pathname.startsWith("/login")) {
        const url = new URL("/home", request.nextUrl)
        return Response.redirect(url)
      }

      return true
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})

export const handlers: NextAuthResult["handlers"] = nextAuthInstance.handlers
export const auth: NextAuthResult["auth"] = nextAuthInstance.auth
export const signIn: NextAuthResult["signIn"] = nextAuthInstance.signIn
export const signOut: NextAuthResult["signOut"] = nextAuthInstance.signOut

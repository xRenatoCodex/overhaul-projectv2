import type { NextAuthConfig } from "next-auth"

// Edge-safe config: no Credentials provider / backend imports here (used by middleware).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
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
}

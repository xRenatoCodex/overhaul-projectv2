import NextAuth, { type NextAuthResult } from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authService, ensureBackendSeeded, UnauthorizedError } from "@workspace/backend"
import { loginRequestSchema } from "@workspace/backend/lib/validators/auth"

import { authConfig } from "@/auth.config"

const nextAuthInstance: NextAuthResult = NextAuth({
  ...authConfig,
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
})


export const handlers: NextAuthResult["handlers"] = nextAuthInstance.handlers
export const auth: NextAuthResult["auth"] = nextAuthInstance.auth
export const signIn: NextAuthResult["signIn"] = nextAuthInstance.signIn
export const signOut: NextAuthResult["signOut"] = nextAuthInstance.signOut

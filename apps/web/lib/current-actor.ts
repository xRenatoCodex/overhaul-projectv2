import type { AuthUser } from "@workspace/backend/types/auth"
import { auth } from "@/auth"

export async function getCurrentActor(): Promise<AuthUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  }
}

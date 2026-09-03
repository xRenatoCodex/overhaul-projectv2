import { auth } from "@/auth"

/** Id of the User attributed as author of a stage version (FK target). */
export async function getCurrentActor(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

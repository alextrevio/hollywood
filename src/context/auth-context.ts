import { createContext } from "react"
import type { Session, User } from "@supabase/supabase-js"

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** Returns `{ error }` with a human-readable message on failure, or null on success. */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

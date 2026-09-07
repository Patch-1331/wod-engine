import { useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "./lib/api";

/**
 * The api module is plain functions, not hooks, so it cannot call useAuth().
 * This bridge lives inside ClerkProvider and hands it a getter instead, which
 * keeps token retrieval in Clerk's hands — it refreshes the short-lived
 * session token on demand — without threading auth through every call site.
 */
export function ApiAuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  setTokenGetter(getToken);
  return <>{children}</>;
}

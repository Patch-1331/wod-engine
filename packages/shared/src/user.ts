import { z } from "zod";

/** v1 stub: one implicit row, unused by the UI. Exists so v2 multi-user/auth is a feature, not a migration. */
export const userSchema = z.object({
  id: z.string(),
});
export type User = z.infer<typeof userSchema>;

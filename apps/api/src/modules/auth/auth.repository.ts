import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { admins, adminSessions } from "../../db/schema.js";

export class AuthRepository {
  findActiveAdmin(email: string) {
    return db
      .select()
      .from(admins)
      .where(and(eq(admins.email, email.toLowerCase()), eq(admins.isActive, 1)))
      .limit(1)
      .then(([admin]) => admin);
  }

  deleteSession(tokenHash: string) {
    return db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
  }
}

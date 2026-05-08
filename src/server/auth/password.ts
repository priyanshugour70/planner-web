import bcrypt from "bcryptjs";
import { getServerEnv } from "@/lib/config/server-env";

export async function hashPassword(plain: string): Promise<string> {
  const cost = getServerEnv().BCRYPT_COST;
  return bcrypt.hash(plain, cost);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

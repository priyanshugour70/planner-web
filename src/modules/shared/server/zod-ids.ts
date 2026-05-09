import { z } from "zod";

/** BigInt primary key serialized as decimal digits (paths / JSON bodies). */
export const idStringSchema = z.string().regex(/^\d+$/);

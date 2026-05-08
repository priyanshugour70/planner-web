import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username may only contain letters, numbers, dot, underscore, hyphen");

export const signupBodySchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().max(255).optional(),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  deviceId: z.string().max(128).optional(),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(10).max(2048),
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  email: emailSchema,
  code: z.string().min(4).max(32),
  newPassword: passwordSchema,
});

export const sendOtpBodySchema = z.object({
  email: emailSchema,
  purpose: z.enum([
    "login",
    "email_verification",
    "password_reset",
    "phone_verification",
    "two_factor",
  ]),
});

export const verifyOtpBodySchema = z.object({
  email: emailSchema,
  code: z.string().min(4).max(32),
  purpose: sendOtpBodySchema.shape.purpose,
});

export const resendOtpBodySchema = sendOtpBodySchema;

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const logoutBodySchema = z
  .object({
    refreshToken: z.string().min(10).max(2048).optional(),
  })
  .strict();

export const revokeSessionParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

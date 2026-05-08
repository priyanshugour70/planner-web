/** OpenAPI 3.0 document for Planner Auth API v1 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Planner API",
    version: "1.0.0",
    description:
      "Enterprise authentication and session APIs. All success responses follow the envelope: success, message, data, meta, timestamp, requestId.",
  },
  servers: [{ url: "/api/v1", description: "Version 1" }],
  tags: [{ name: "Auth", description: "Authentication and sessions" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        required: ["success", "message", "data", "meta", "timestamp", "requestId"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {},
          meta: { type: "object", additionalProperties: true },
          timestamp: { type: "string", format: "date-time" },
          requestId: { type: "string", format: "uuid" },
        },
      },
      ErrorEnvelope: {
        type: "object",
        required: ["success", "message", "error", "timestamp", "requestId"],
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              details: { type: "object", additionalProperties: true },
              stack: { type: "string" },
            },
          },
          timestamp: { type: "string", format: "date-time" },
          requestId: { type: "string" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          expiresIn: { type: "integer" },
          tokenType: { type: "string", example: "Bearer" },
          sessionId: { type: "string", format: "uuid" },
        },
      },
      UserPublic: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          emailVerified: { type: "boolean" },
          accountStatus: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", minLength: 3, maxLength: 64 },
                  email: { type: "string", format: "email" },
                  password: {
                    type: "string",
                    minLength: 12,
                    description:
                      "Must include upper, lower, number, and symbol characters.",
                  },
                  fullName: { type: "string", maxLength: 255 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          allOf: [
                            { $ref: "#/components/schemas/AuthTokens" },
                            {
                              type: "object",
                              properties: {
                                user: { $ref: "#/components/schemas/UserPublic" },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "409": { description: "Email or username already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Password login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  deviceId: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (revoke session / blacklist access token)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate refresh token and issue new access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "401": { description: "Invalid refresh" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset OTP (email delivery not included)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { "200": { description: "Always returns generic success" } },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code", "newPassword"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string" },
                  newPassword: { type: "string", minLength: 12 },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Invalid OTP" } },
      },
    },
    "/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "Send email OTP (requires existing user)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "purpose"],
                properties: {
                  email: { type: "string", format: "email" },
                  purpose: {
                    type: "string",
                    enum: [
                      "login",
                      "email_verification",
                      "password_reset",
                      "phone_verification",
                      "two_factor",
                    ],
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "404": { description: "User not found" } },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP (login or email verification)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code", "purpose"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string" },
                  purpose: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend OTP (same as send-otp)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "purpose"],
                properties: {
                  email: { type: "string", format: "email" },
                  purpose: {
                    type: "string",
                    enum: [
                      "login",
                      "email_verification",
                      "password_reset",
                      "phone_verification",
                      "two_factor",
                    ],
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "404": { description: "User not found" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/auth/sessions": {
      get: {
        tags: ["Auth"],
        summary: "List active sessions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/sessions/revoke-others": {
      post: {
        tags: ["Auth"],
        summary: "Revoke all sessions except current",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/sessions/{sessionId}": {
      delete: {
        tags: ["Auth"],
        summary: "Revoke a single session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password (invalidates all sessions)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 12 },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
  },
};

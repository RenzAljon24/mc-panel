import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN;
const enableCrossSubdomain = !!BASE_DOMAIN && process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "owner" },
    },
  },
  advanced: enableCrossSubdomain
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: `.${BASE_DOMAIN}`,
        },
        defaultCookieAttributes: {
          sameSite: "lax",
          secure: true,
        },
      }
    : undefined,
  trustedOrigins: (process.env.NEXT_PUBLIC_APP_URL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});

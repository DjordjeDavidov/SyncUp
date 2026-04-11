import { PrismaClient } from "@prisma/client";

const allowedDatabaseProtocols = ["postgresql:", "postgres:", "prisma:", "prisma+postgres:"];
const allowedDirectProtocols = ["postgresql:", "postgres:"];

declare global {
  // eslint-disable-next-line no-var
  var __syncup_prisma__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __syncup_prisma_env_logged__: boolean | undefined;
}

function redactConnectionString(value: string) {
  try {
    const parsed = new URL(value);

    if (parsed.username) {
      parsed.username = "***";
    }

    if (parsed.password) {
      parsed.password = "***";
    }

    return parsed.toString();
  } catch {
    return "[invalid database url]";
  }
}

function assertConnectionString(name: "DATABASE_URL" | "DIRECT_URL", value: string | undefined, allowedProtocols: string[]) {
  if (!value) {
    throw new Error(
      `[prisma] Missing ${name}. Add it to the project root .env.local or .env file before starting Next.js.`,
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `[prisma] Invalid ${name}. Expected a database connection string like postgresql://USER:PASSWORD@HOST:PORT/DATABASE.`,
    );
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(
      `[prisma] Invalid ${name} protocol "${parsed.protocol}". Expected one of: ${allowedProtocols.join(", ")}.`,
    );
  }

  return parsed;
}

function validatePrismaEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  assertConnectionString("DATABASE_URL", databaseUrl, allowedDatabaseProtocols);

  if (directUrl) {
    assertConnectionString("DIRECT_URL", directUrl, allowedDirectProtocols);
  }

  if (process.env.NODE_ENV === "development" && !globalThis.__syncup_prisma_env_logged__) {
    console.info("[prisma] DATABASE_URL loaded:", redactConnectionString(databaseUrl!));

    if (directUrl) {
      console.info("[prisma] DIRECT_URL loaded:", redactConnectionString(directUrl));
    }

    globalThis.__syncup_prisma_env_logged__ = true;
  }
}

function createPrismaClient() {
  validatePrismaEnvironment();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : globalThis.__syncup_prisma__ ?? (globalThis.__syncup_prisma__ = createPrismaClient());

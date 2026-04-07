const fs = require("fs");
const path = require("path");

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const { PrismaClient } = require("@prisma/client");
const world = require("./seed/world");
const { seedDemoWorld } = require("./seed/seeders");

const prisma = new PrismaClient({
  log: ["warn", "error"],
});

async function main() {
  const result = await seedDemoWorld(prisma, world);

  console.log("Demo seed complete.");
  console.log(`Demo login password: ${result.demoPassword}`);

  for (const [model, count] of Object.entries(result.counts)) {
    console.log(`${model}: ${count}`);
  }
}

main()
  .catch((error) => {
    console.error("Demo seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`Creating admin user ${email}…`);
    const result = await auth.api.signUpEmail({
      body: { email, password, name: "Admin" },
    });
    if (!result.user) throw new Error("Signup failed");
    user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not persisted");
  } else {
    console.log(`Admin user ${email} already exists`);
  }

  const existingServer = await prisma.server.findFirst({ where: { ownerId: user.id } });
  if (!existingServer) {
    const rconPassword = `rcon_${Math.random().toString(36).slice(2, 10)}`;
    const server = await prisma.server.create({
      data: {
        ownerId: user.id,
        name: "Survival",
        jarType: "paper",
        jarVersion: "1.21.4",
        ramMb: 3072,
        portJava: 25565,
        portBedrock: 19132,
        portRcon: 25575,
        rconPassword,
        idleTimeoutSec: 600,
        onlineMode: false,
        motd: "Welcome! Cross-platform (Java + Bedrock) cracked server",
        whitelist: true,
      },
    });
    console.log(`Created server ${server.id} (RCON password: ${rconPassword})`);

    await prisma.plugin.createMany({
      data: [
        { serverId: server.id, slug: "geyser", name: "Geyser-Spigot", source: "modrinth", version: "2.6.1" },
        { serverId: server.id, slug: "floodgate", name: "Floodgate", source: "modrinth", version: "2.2.3" },
        { serverId: server.id, slug: "coreprotect", name: "CoreProtect", source: "modrinth", version: "22.4" },
      ],
    });
  } else {
    console.log(`Server ${existingServer.id} already exists`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

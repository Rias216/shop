import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { encryptSettingValue, isEncryptedSettingValue } from "../src/lib/secure-settings";

function createClient(): { db: PrismaClient; cleanup: () => Promise<void> } {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    const db = new PrismaClient({ adapter });
    return {
      db,
      cleanup: async () => db.$disconnect(),
    };
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  return {
    db,
    cleanup: async () => {
      await db.$disconnect();
      await pool.end();
    },
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const key = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!key) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is required.");
  }

  const { db, cleanup } = createClient();
  try {
    const row = await db.storeSettings.findUnique({ where: { id: "default" } });
    if (!row) {
      console.log("No store settings row found.");
      return;
    }

    const update = {
      paypalClientSecret: encryptSettingValue(row.paypalClientSecret),
      nowpaymentsApiKey: encryptSettingValue(row.nowpaymentsApiKey),
      nowpaymentsIpnSecret: encryptSettingValue(row.nowpaymentsIpnSecret),
      resendApiKey: encryptSettingValue(row.resendApiKey),
      edgeApiKey: encryptSettingValue(row.edgeApiKey),
    };

    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            dryRun: true,
            paypalClientSecretChanged: update.paypalClientSecret !== row.paypalClientSecret,
            nowpaymentsApiKeyChanged: update.nowpaymentsApiKey !== row.nowpaymentsApiKey,
            nowpaymentsIpnSecretChanged: update.nowpaymentsIpnSecret !== row.nowpaymentsIpnSecret,
            resendApiKeyChanged: update.resendApiKey !== row.resendApiKey,
            edgeApiKeyChanged: update.edgeApiKey !== row.edgeApiKey,
          },
          null,
          2,
        ),
      );
      return;
    }

    await db.storeSettings.update({
      where: { id: "default" },
      data: update,
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          updated: true,
          encrypted: {
            paypalClientSecret: isEncryptedSettingValue(update.paypalClientSecret),
            nowpaymentsApiKey: isEncryptedSettingValue(update.nowpaymentsApiKey),
            nowpaymentsIpnSecret: isEncryptedSettingValue(update.nowpaymentsIpnSecret),
            resendApiKey: isEncryptedSettingValue(update.resendApiKey),
            edgeApiKey: isEncryptedSettingValue(update.edgeApiKey),
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

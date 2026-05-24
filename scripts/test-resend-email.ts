import "dotenv/config";
import { sendTestEmail } from "../src/lib/email";

async function main() {
  const to = process.argv[2] ?? process.env.TEST_EMAIL_TO;
  if (!to) {
    console.error("Usage: npm run email:test -- you@example.com");
    process.exit(1);
  }

  await sendTestEmail(to);
  console.log(`Test email sent to ${to}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

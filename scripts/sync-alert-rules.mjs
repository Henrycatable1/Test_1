import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "..");
const sourcePath = resolve(repoRoot, "docs/alert_rules.json");
const targetPath = resolve(repoRoot, "supabase/functions/_shared/alert-rules.json");

async function syncAlertRules() {
  const sourceText = await readFile(sourcePath, "utf8");
  const parsed = JSON.parse(sourceText);
  const normalized = `${JSON.stringify(parsed, null, 2)}\n`;

  await writeFile(targetPath, normalized, "utf8");

  console.log(`Synced alert rules to ${targetPath}`);
}

syncAlertRules().catch((error) => {
  console.error("Failed to sync alert rules.");
  console.error(error);
  process.exitCode = 1;
});

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type NormalizedRecord = {
  source_row_number: number;
  source_row_hash: string;
  canonical_store: string;
  product_name: string;
  quantity: number;
  price: number;
  sale_date: string;
  normalized_payload: Record<string, unknown>;
  quality_notes: string[];
  reorder_signal: "ok" | "watch" | "reorder" | "stockout";
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

export async function runNormalizer(sourceFilename: string): Promise<NormalizedRecord[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("poetry", ["run", "normalizer", "--input", sourceFilename], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Normalizer exited with code ${code}`));
        return;
      }
      resolve(JSON.parse(stdout) as NormalizedRecord[]);
    });
  });
}

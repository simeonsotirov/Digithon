import { execFile } from "node:child_process";
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
    execFile(
      "poetry",
      ["run", "normalizer", "--input", sourceFilename],
      {
        cwd: repoRoot,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (stderr) {
          console.error("normalizer stderr:", stderr);
        }
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        try {
          resolve(JSON.parse(stdout) as NormalizedRecord[]);
        } catch {
          reject(new Error(`Normalizer output is not valid JSON: ${stdout.slice(0, 200)}`));
        }
      },
    );
  });
}

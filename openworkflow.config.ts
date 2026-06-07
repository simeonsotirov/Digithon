import { defineConfig } from "@openworkflow/cli";
import { BackendPostgres } from "openworkflow/postgres";

const databaseUrl =
  process.env.OPENWORKFLOW_POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or OPENWORKFLOW_POSTGRES_URL is required");
}

export default defineConfig({
  backend: await BackendPostgres.connect(databaseUrl, {
    namespaceId: process.env.OPENWORKFLOW_NAMESPACE_ID ?? "digithon-local",
    schema: process.env.OPENWORKFLOW_SCHEMA ?? "openworkflow",
  }),
  dirs: ["./openworkflow"],
  worker: {
    concurrency: 1,
  },
});

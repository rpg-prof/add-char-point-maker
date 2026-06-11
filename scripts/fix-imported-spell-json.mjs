#!/usr/bin/env node
/** @deprecated Use scripts/backfill-spell-metadata.mjs */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "backfill-spell-metadata.mjs",
);
const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
process.exit(result.status ?? 1);

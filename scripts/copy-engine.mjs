import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packageJson = require.resolve("fairy-stockfish-nnue.wasm/package.json");
const packageDir = dirname(packageJson);
const destination = join(process.cwd(), "public", "lib");

await mkdir(destination, { recursive: true });
for (const filename of ["stockfish.js", "stockfish.wasm", "stockfish.worker.js", "uci.js"]) {
  await cp(join(packageDir, filename), join(destination, filename));
}
console.log("Copied Fairy-Stockfish browser engine into public/lib.");

import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../..");
const budgets = JSON.parse(
  await readFile(join(workspaceRoot, "tools/bundle-budgets.json"), "utf8"),
);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    }),
  );
  return files.flat();
}

async function gzipSize(file) {
  return gzipSync(await readFile(file)).byteLength;
}

async function totalJavaScriptGzip(directory) {
  const files = (await filesIn(directory)).filter((file) => file.endsWith(".js"));
  return (await Promise.all(files.map(gzipSize))).reduce((total, size) => total + size, 0);
}

async function shellBootstrapGzip() {
  const assetsDirectory = join(workspaceRoot, "apps/shell/dist/assets");
  const bootstrap = (await filesIn(assetsDirectory)).find((file) =>
    /\/bootstrap-[^/]+\.js$/.test(file),
  );
  if (!bootstrap) throw new Error("Shell bootstrap chunk was not found. Build shell first.");
  return gzipSize(bootstrap);
}

const measurements = {
  shellBootstrapGzipBytes: await shellBootstrapGzip(),
  accountJavaScriptGzipBytes: await totalJavaScriptGzip(join(workspaceRoot, "apps/account/dist")),
  commerceJavaScriptGzipBytes: await totalJavaScriptGzip(join(workspaceRoot, "apps/commerce/dist")),
};

let exceeded = false;
for (const [name, size] of Object.entries(measurements)) {
  const budget = budgets[name];
  const status = size <= budget ? "PASS" : "FAIL";
  console.log(`${status} ${name}: ${size} B gzip (budget ${budget} B)`);
  exceeded ||= size > budget;
}

if (exceeded) process.exitCode = 1;

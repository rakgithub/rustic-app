import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { withRelatedProject } from "@vercel/related-projects";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputFile = resolve(scriptDirectory, "../../apps/shell/public/remotes.json");
const isVercelBuild = Boolean(process.env.VERCEL_ENV);

function remoteEntryUrl(host, remoteName) {
  if (!host) {
    throw new Error(`No deployment URL is available for the ${remoteName} remote.`);
  }

  const url = new URL(host);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error(`${remoteName} remote URL must use http or https.`);
  }

  url.pathname = url.pathname.endsWith("/remoteEntry.js")
    ? url.pathname
    : `${url.pathname.replace(/\/$/, "")}/remoteEntry.js`;
  return url.toString();
}

function providerHost(projectName, fallbackEnvName, localFallback) {
  const fallback = process.env[fallbackEnvName];

  // Related Projects supplies a same-branch preview alias. Production deliberately
  // uses the explicit stable alias configured in Vercel environment variables.
  if (process.env.VERCEL_ENV === "preview") {
    const relatedHost = withRelatedProject({
      projectName,
      defaultHost: fallback,
    });
    if (relatedHost) return relatedHost;
  }

  if (fallback) return fallback;
  if (!isVercelBuild) return localFallback;

  throw new Error(
    `Set ${fallbackEnvName} for this Vercel environment, or connect ${projectName} as a related project for previews.`,
  );
}

const accountHost = providerHost("market-account", "ACCOUNT_REMOTE_URL", "http://localhost:5101");
const commerceHost = providerHost(
  "market-commerce",
  "COMMERCE_REMOTE_URL",
  "http://localhost:5102",
);

const registry = {
  account: { name: "account", entry: remoteEntryUrl(accountHost, "account") },
  commerce: {
    name: "commerce",
    entry: remoteEntryUrl(commerceHost, "commerce"),
  },
};

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(registry, null, 2)}\n`);

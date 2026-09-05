import { spawn } from "node:child_process";

const remotes = [
  {
    name: "account",
    url: process.env.ACCOUNT_REMOTE_URL ?? "http://127.0.0.1:5101/remoteEntry.js",
    command: ["--dir", "apps/account", "run", "dev"],
  },
  {
    name: "commerce",
    url: process.env.COMMERCE_REMOTE_URL ?? "http://127.0.0.1:5102/remoteEntry.js",
    command: ["--dir", "apps/commerce", "run", "dev"],
  },
];
const started = [];

async function canFetch(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

async function waitForRemote(remote) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canFetch(remote.url)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${remote.name} remote did not start at ${remote.url}`);
}

try {
  for (const remote of remotes) {
    const usesLocalDefault = !process.env[`${remote.name.toUpperCase()}_REMOTE_URL`];
    if (usesLocalDefault && !(await canFetch(remote.url))) {
      const child = spawn("pnpm", remote.command, { stdio: "ignore" });
      started.push(child);
      await waitForRemote(remote);
    }

    const response = await fetch(remote.url);
    if (!response.ok)
      throw new Error(`${remote.name} remote entry returned HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("javascript"))
      throw new Error(`${remote.name} remote entry is not JavaScript (${contentType})`);
    const source = await response.text();
    for (const requiredShare of ["react", "react-router-dom"]) {
      if (!source.includes(requiredShare))
        throw new Error(`${remote.name} does not declare ${requiredShare} as a shared dependency`);
    }
    console.log(`✓ ${remote.name}: ${remote.url}`);
  }
} finally {
  for (const child of started) child.kill("SIGTERM");
}

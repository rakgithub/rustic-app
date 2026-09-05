const remotes = [
  { name: 'account', url: process.env.ACCOUNT_REMOTE_URL ?? 'http://127.0.0.1:5101/remoteEntry.js' },
  { name: 'commerce', url: process.env.COMMERCE_REMOTE_URL ?? 'http://127.0.0.1:5102/remoteEntry.js' },
];

for (const remote of remotes) {
  const response = await fetch(remote.url);
  if (!response.ok) throw new Error(`${remote.name} remote entry returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('javascript')) throw new Error(`${remote.name} remote entry is not JavaScript (${contentType})`);
  const source = await response.text();
  for (const requiredShare of ['react', 'react-router-dom']) {
    if (!source.includes(requiredShare)) throw new Error(`${remote.name} does not declare ${requiredShare} as a shared dependency`);
  }
  console.log(`✓ ${remote.name}: ${remote.url}`);
}

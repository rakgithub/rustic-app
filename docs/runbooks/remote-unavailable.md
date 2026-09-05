# Remote unavailable

## Signal

The shell shows a provider fallback, or the federation smoke check cannot fetch
`remoteEntry.js`.

## Response

1. Record the provider name, Support ID, shell deployment URL, and request ID.
2. Check the provider deployment and its `remoteEntry.js` response, including
   CORS and `Cache-Control` headers.
3. Restore the last known-good remote URL in the shell environment or roll the
   shell back to the prior `remotes.json` deployment.
4. Verify the shell, account, and commerce critical flows before closing.

Do not disable the shell: its provider boundary is designed to preserve the
other provider and public experience.

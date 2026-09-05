# Blob upload abuse

## Signal

Unexpected upload volume, invalid upload token usage, oversized objects, or
malicious content reports.

## Response

1. Preserve request IDs, object pathnames, and actor IDs; do not expose upload
   tokens in tickets or logs.
2. Revoke or reduce the affected upload capability and block abusive actors.
3. Delete only confirmed abusive objects according to the retention policy.
4. Review file type, size, and ownership validation before restoring uploads.
5. Verify a normal listing-image upload after remediation.

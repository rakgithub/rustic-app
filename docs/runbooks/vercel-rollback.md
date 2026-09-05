# Vercel rollback

## Signal

A production deployment causes a customer-impacting regression or a provider
is incompatible with the shell.

## Response

1. Identify the last known-good deployment for the affected Vercel project.
2. Promote that deployment using Vercel's rollback action.
3. For federation-only failures, restore the shell's previous remote map first;
   this avoids rebuilding provider code.
4. Verify `/health`, public browsing, login, listing creation, and purchase.
5. Record deployment IDs, request IDs, and customer impact in the incident.

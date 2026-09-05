# Failed migration

## Signal

`db:migrate` fails, the deployment cannot connect to the database, or schema
errors appear after a release.

## Response

1. Stop further production deployments and preserve the migration output.
2. Identify the last successful migration in the migration ledger.
3. Use a backward-compatible application version while investigating; never
   edit an applied migration in place.
4. Rehearse the corrective migration against a restored non-production copy.
5. Apply the corrective migration through the normal deployment workflow and
   verify health, reads, writes, and order creation.

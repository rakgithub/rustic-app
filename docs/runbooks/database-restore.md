# Database restore

## Signal

A restore rehearsal is due, data loss is suspected, or a recovery plan must be
validated.

## Response

1. Restore into a new non-production database. Never rehearse against
   production.
2. Record the backup timestamp, restore duration, and target database ID.
3. Run migrations only when the restored snapshot needs to match the current
   application version.
4. Verify product, order, wallet, and ledger counts plus ledger balance
   invariants.
5. Destroy the rehearsal database after the agreed retention period.

# Wallet invariant failure

## Signal

An order has unbalanced ledger entries, a balance becomes negative, or a wallet
transaction cannot be reconciled.

## Response

1. Stop the affected purchase path; do not manually change balances.
2. Preserve order ID, transaction ID, request ID, and deployment version.
3. Query the immutable ledger entries and verify debit equals credit.
4. Correct with a compensating ledger transaction reviewed by an authorized
   operator. Never update historical ledger rows.
5. Add a regression test before re-enabling purchases.

# Login outage

## Signal

Login requests fail, sessions cannot be refreshed, or authentication errors
rise above the normal baseline.

## Response

1. Capture the request ID and deployment version; do not record credentials or
   session tokens.
2. Check the identity provider status and the API authentication logs.
3. Roll back only an authentication change that is known to be the cause.
4. Keep public browsing available and return a safe retry message for sign-in.
5. Verify sign-in, sign-out, session refresh, and a protected purchase flow.

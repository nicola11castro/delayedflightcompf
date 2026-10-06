# DelayedFlightComp — delayedflightcomp.com

Flight delay compensation service for Canadian passengers under the Air Passenger
Protection Regulations (APPR). Passengers estimate what they are owed, submit a
claim with their documents, and track it by Claim ID. The company takes a
transparent 15% commission, only on successful claims. Windows 98 look and feel
included.

This repository was originally built on Replit and is now portable: it runs on
any host that offers Node 20+ and a PostgreSQL database.

## Stack

| Layer    | Technology                                                         |
| -------- | ------------------------------------------------------------------ |
| Frontend | React 18, Vite, Tailwind, shadcn/ui, TanStack Query, wouter, Zod   |
| Backend  | Node 20+, Express, TypeScript (ES modules)                         |
| Database | PostgreSQL via Drizzle ORM (`pg` driver, works with Neon/Railway/Render/Supabase/local) |
| Auth     | Email + password (passport-local, scrypt hashes, sessions in Postgres), email verification, password reset |
| Languages | English and French (Québec); toggle in the navigation, dictionaries in `client/src/i18n/` |
| Shared   | `shared/schema.ts` (tables + Zod schemas), `shared/appr.ts` (APPR rules) |

## Run locally

```bash
npm ci
cp .env.example .env            # fill in DATABASE_URL at minimum
export $(grep -v '^#' .env | xargs)
npm run db:push                 # creates/updates the tables
npm run dev                     # http://localhost:5000
```

Checks: `npm run check` (TypeScript) and `npm run build` (client + server bundle).
`npm start` serves the production build from `dist/`.

## Deploy

The app is a single long-running Node process serving both the API and the
built client, so pick a host that runs a server (not static or serverless-only
hosting).

| Host    | How                                                                                  |
| ------- | ------------------------------------------------------------------------------------ |
| Railway | Add a PostgreSQL service, set the env vars below, push. `railway.json` builds and runs `db:push && npm start`. |
| Render  | `render.yaml` defines the web service + database. Set `ADMIN_EMAILS` and the optional secrets in the dashboard. |
| Docker  | `docker build -t flightclaim .` then run with the env vars below. Run `npm run db:push` once against the database. |

Point the DNS for `www.delayedflightcomp.com` (see `CNAME`) at the host and let it
issue the TLS certificate. Login cookies are `Secure`, so production must be served over HTTPS.

### Environment variables

| Variable                | Required | Purpose                                                                 |
| ----------------------- | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`          | yes      | PostgreSQL connection string                                            |
| `SESSION_SECRET`        | yes (prod) | Signs login cookies; any long random string                           |
| `NODE_ENV`              | yes      | `production` on a host                                                  |
| `PORT`                  | no       | Defaults to 5000; hosts usually inject it                               |
| `ADMIN_EMAILS`          | no       | Comma-separated emails that become senior admin on register/login (defaults to the founder's email) |
| `APP_URL`               | no       | Public URL, used for DocuSign return links                              |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | no | Chatbot + AI second-opinion pre-screen (default model `gpt-4o`)  |
| `SMTP_HOST/PORT/USER/PASS/FROM` | no | Outgoing email (confirmations, status updates, invoices, airline letters, campaigns) |
| `AIRLINE_CLAIMS_EMAIL`  | no       | Where the admin "email airline" button sends claim letters              |
| `PAYMENT_INSTRUCTIONS`  | no       | Text in commission invoices                                             |
| `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | no | Admin export to Google Sheets |
| `AIRTABLE_BASE_ID`, `AIRTABLE_API_KEY` | no | Mirror new claims into Airtable                              |
| `DOCUSIGN_*`            | no       | Power of Attorney e-signature                                           |
| `DATABASE_SSL=false`    | no       | Only for databases without TLS (local)                                  |
| `CONSENT_FILES=false`   | no       | Skip JSON copies of consent records on read-only disks                  |

Every optional integration degrades gracefully: the feature reports "not
configured" instead of failing silently. Without SMTP, verification and
password-reset links are printed in the server log so you can still test them.
Marketing emails carry a signed one-click unsubscribe link.

## Admin access

1. Set `ADMIN_EMAILS` to your email on the host.
2. Register (or log in) on the site with that email. You are promoted to
   `senior_admin` automatically.
3. Open `/admin`. Senior admins can promote other users to `junior_admin`
   (claims + payments) or `senior_admin` (everything, including users, campaigns
   and exports) from the Users tab.

## Languages

Every passenger-facing screen, the consent documents and the verification /
reset emails exist in English and French. Add or edit strings in
`client/src/i18n/en.ts` and `client/src/i18n/fr.ts`; TypeScript fails the build
if a French key is missing. The admin dashboard is English only.

The French legal texts (terms, privacy, retention, POA, marketing consent) were
written for this release and should be reviewed by a lawyer before launch, as
should the English ones.

## How a claim flows

1. **Calculator** (`/#calculator`): airline + delay length + reason → APPR amount, 15% fee, net. No account needed.
2. **Claim form** (`/#claims`): 3 steps (flight details, documents, consents). Signed-in users get their name and email prefilled and the claim is attached to their account. Passengers can answer "I don't know" for the reason; a reason that is normally not compensable shows a warning but can still be submitted so the team can verify what the airline really said.
3. **Server** generates one Claim ID (`YUL-xxxxxxxx-xxxxxx`), computes the compensation from the APPR rules table (delays and cancellations by carrier size; denied boarding $900 / $1,800 / $2,400 for any carrier), flags claims that need the reason verified, stores the claim, records the POA (and optional marketing) consent, then in the background runs the optional AI pre-screen, Airtable mirror and confirmation email.
4. **Passenger** sees the Claim ID on screen (and by email when SMTP is set), tracks it at `/#track`, and sees all their claims at `/my-claims`.
5. **Admin** reviews claims, downloads documents, emails the airline, approves/rejects, sends the commission invoice and marks the claim paid.

The money figures never come from the AI model; they come from
`shared/appr.ts`, which the calculator, the claim form, the APPR guide page and
the server all share.

## Data

| Where                 | What                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `users`               | Accounts, scrypt password hashes, roles, registration consents                         |
| `claims`              | Claims, status history, compensation, consent flags, document URLs                     |
| `consent_records`     | Audit trail of every consent (type, email, claim, IP, user agent, time)                |
| `sessions`            | Login sessions                                                                         |
| `auth_tokens`         | One-time tokens (hashed) for email verification and password reset                     |
| `faq_items`           | FAQ entries (the site shows built-in defaults when the table is empty)                 |
| `uploads/`            | Uploaded documents on local disk, served to admins only                                |
| `consent-records/`    | JSON copies of consent records (convenience; the database is the source of truth)      |

On hosts with ephemeral disks (Railway/Render without a volume) uploaded documents are lost on redeploy; attach a persistent volume or move uploads to object storage (S3/R2) before taking real claims.

## Known gaps

- Uploaded documents live on local disk (see above).
- DocuSign: envelopes are created, but the completion callback does not yet link the signed envelope back to the claim.
- Payments tab is derived from approved/paid claims; there is no separate ledger.
- Legal text exists twice (server `consent-manager.ts` for the generated documents, client `consent-modal.tsx` for the on-screen modals) and should be unified.

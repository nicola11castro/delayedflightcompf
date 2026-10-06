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
| `FLIGHT_DATA_PROVIDER`, `AVIATIONSTACK_API_KEY` | no | Flight lookup (auto-fill + delay verification). Adapter pattern: add another provider in `server/services/flight-data.ts` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | no | Commission payment links; point the Stripe webhook at `/api/stripe/webhook` (event `checkout.session.completed`) |
| `DOCUSIGN_*`            | no       | Legacy DocuSign integration (the built-in signature replaces it)         |
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

1. **Check my flight** (top of the landing page): flight number + date. With a flight-data provider configured the route, status and arrival delay are looked up and the APPR band is shown; without one, the airline is recognised from the code. Either way one click prefills the claim form.
2. **Calculator** (`/#calculator`): what happened + airline + delay length + reason → APPR amount, 15% fee, net. No account needed.
3. **Claim form** (`/#claims`): 3 steps (flight details, documents, consents). A "scan my boarding pass" button reads the pass with OpenAI vision when a key is set, otherwise with on-device OCR (tesseract.js), and fills the flight fields. Signed-in users get their name and email prefilled and the claim is attached to their account. Passengers can answer "I don't know" for the reason; a reason that is normally not compensable shows a warning but can still be submitted so the team can verify what the airline really said.
4. **Server** generates one Claim ID (`YUL-xxxxxxxx-xxxxxx`), computes the compensation from the APPR rules table (delays and cancellations by carrier size; denied boarding $900 / $1,800 / $2,400 for any carrier), flags claims that need the reason verified, stores the claim, records the POA (and optional marketing) consent, then in the background runs the optional AI pre-screen, Airtable mirror and confirmation email.
5. **Passenger** sees the Claim ID on screen (and by email when SMTP is set), tracks it at `/#track`, and sees all their claims at `/my-claims`.
6. **Passenger** signs the Power of Attorney on screen (`/sign/:claimId`, link in the confirmation email and on My Claims). The server renders a bilingual PDF, stores it, and emails a copy.
7. **Admin** opens the claim page (`/admin/claims/:id`): flight data from the provider with a "differs from reported" flag when the passenger's delay does not match, timeline of every note, email, status change, letter, signature and payment; "send to airline" starts the 30-day APPR clock; overdue claims are flagged and can be escalated to the CTA in one click; approve/reject/paid each send a bilingual email; the commission invoice carries a Stripe payment link when Stripe is configured (e-Transfer instructions otherwise) and the webhook marks the claim paid.

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
| `claim_events`        | Timeline per claim: notes, emails sent, status changes, letters, escalation, POA, payments |
| `faq_items`           | FAQ entries (the site shows built-in defaults when the table is empty)                 |
| `uploads/`            | Uploaded documents on local disk, served to admins only                                |
| `consent-records/`    | JSON copies of consent records (convenience; the database is the source of truth)      |

On hosts with ephemeral disks (Railway/Render without a volume) uploaded documents are lost on redeploy; attach a persistent volume or move uploads to object storage (S3/R2) before taking real claims.

## Known gaps

- Uploaded documents live on local disk (see above).
- Payments tab is derived from approved/paid claims; there is no separate ledger beyond the claim event log.
- No automatic reminder when an airline deadline passes; the dashboard flags it as overdue, but nobody is emailed.
- Legal text exists twice (server `consent-manager.ts` for the generated documents, client `consent-modal.tsx` for the on-screen modals) and should be unified.

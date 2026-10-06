# FlightClaim Pro

> Project notes carried over from Replit. See README.md for current setup and deployment instructions.

## Overview

FlightClaim Pro is a full-stack web application for processing flight compensation claims with a transparent 15% commission structure. The application provides a streamlined interface for passengers to submit claims for flight delays, cancellations, and denied boarding incidents, while offering automated eligibility validation and commission calculations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **File Uploads**: Multer middleware for handling document uploads
- **Database ORM**: Drizzle ORM with type-safe schema definitions

### Database Strategy
- **Primary Database**: Any PostgreSQL (local, Neon, Railway, Render, Supabase) via the standard `pg` driver
- **Connection Pooling**: `pg` Pool (TLS on for hosted databases)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Type Safety**: Shared schema definitions between client and server

## Key Components

### Claim Processing System
- Multi-step form with file upload capabilities
- Unique Claim ID generation using email + UUID (format: YUL-{hash}-{uuid})
- Mandatory delay reason and duration fields for APPR compliance
- Compensation computed from the shared APPR rules table (`shared/appr.ts`); OpenAI GPT-4o is an optional second-opinion pre-screen
- Commission calculation engine with transparent fee structure
- Status tracking with detailed history logging and claim ID lookup
- Power of Attorney (POA) integration via DocuSign

### External Service Integrations
- **OpenAI**: AI-powered claim eligibility validation and chatbot support
- **Airtable**: Alternative data storage and claim management
- **DocuSign**: Electronic signature for POA documents
- **Email Service**: Nodemailer for automated claim notifications
- **File Storage**: Local file system (designed for cloud migration)
- **Google Sheets**: Export claims data for easy sharing and analysis
- **Smart Assistant**: Context-aware Clippy-style guide with airline and delay reason intelligence

### User Interface Features
- Responsive design with mobile-first approach
- Authentic Windows 98 retro styling with beveled borders and MS Sans Serif typography
- Dark/light theme support with system preference detection
- Voice search capability for FAQ interactions
- Real-time commission calculator
- Claim tracking system with status visualization
- Hidden Clippy-style assistant Easter egg with context-aware guidance and smart tips
- Public metrics omitted to avoid misleading users before real customer data is available
- Admin dashboard retains internal tracking for operational purposes
- Comprehensive consent management with modal document viewing
- Registration page with mandatory Terms, Privacy, and Data Retention consents
- Claim submission with required POA and optional Email Marketing consents

## Data Flow

1. **Claim Calculation**: User enters email, distance, delay duration, and reason to generate unique Claim ID
2. **Claim Submission**: User fills multi-step form with flight details and uploads supporting documents
3. **ID Generation**: Unique Claim ID created using format YUL-{base64(email+timestamp)}-{uuid}
4. **Validation**: OpenAI API validates claim eligibility and estimates compensation
5. **Storage**: Claim data stored in PostgreSQL with unique Claim ID and status history tracking
6. **External Sync**: Claim details optionally synced to Airtable for management
7. **POA Process**: If required, DocuSign handles electronic signature workflow
8. **Notifications**: Email confirmations and updates sent via Nodemailer
9. **Tracking**: Users can track claim status using Claim ID through dedicated lookup interface

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **express**: Web application framework
- **multer**: File upload handling

### UI/UX Libraries
- **@radix-ui/***: Accessible component primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form validation and management

### Third-party Services
- **openai**: AI-powered validation and chatbot
- **nodemailer**: Email delivery service
- **class-variance-authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Package Manager**: npm with lockfile for dependency consistency
- **Dev Server**: Concurrent Express server and Vite dev server
- **Hot Reload**: Vite HMR for instant development feedback
- **Error Overlay**: Replit-specific plugins load only when REPL_ID is set

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Any Node host with PostgreSQL (Railway, Render, Docker); Replit still works
- **Database**: Requires PostgreSQL connection via DATABASE_URL environment variable

### Environment Configuration
- **Development**: `npm run dev` starts concurrent dev servers
- **Production**: `npm run build` then `npm run start`
- **Database Migrations**: `npm run db:push` applies schema changes

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
- June 25, 2025. Added Windows 98 retro styling throughout entire application
- June 25, 2025. Implemented hidden Clippy-style assistant Easter egg with smart guidance features
- June 26, 2025. Implemented Claim ID Generator using emails with UUID integration
- June 26, 2025. Added mandatory delay reason and delay duration fields with APPR validation
- June 26, 2025. Created claim status tracking system with YUL-prefixed claim IDs
- June 26, 2025. Removed claims processed and success rate metrics from public pages
- June 26, 2025. Retained internal metrics in admin dashboard for tracking purposes
- June 26, 2025. Implemented hybrid consent approach with Terms, Privacy, Data Retention at registration
- June 26, 2025. Added Power of Attorney and Email Marketing consents in claim submission
- June 26, 2025. Created consent modal system with full document content from attached PDFs
- June 26, 2025. Added visible login and registration navigation options in header and hero sections
- June 26, 2025. Consolidated redundant claim tracking components into single unified interface
- June 26, 2025. Improved page structure with proper section organization and navigation anchors
- June 26, 2025. Added Google Sheets export functionality for claims data
- June 26, 2025. Implemented two-tier admin system (Junior Admin and Senior Admin roles)
- June 26, 2025. Enhanced admin dashboard with role-based access control
- June 26, 2025. Configured pncastrodorion@gmail.com as senior admin with setup page at /admin/setup
- June 26, 2025. Fixed authentication system with development mode login/logout functionality
- June 26, 2025. Added logout functionality to navigation and hero sections with user name display
- June 26, 2025. Resolved authentication loading loop issues for better user experience
- June 26, 2025. Created animated Côney loader component with googly eyes and clock-like rotation  
- June 26, 2025. Replaced all loading spinners with Côney character throughout the application
- June 26, 2025. Enhanced user experience with Montreal-themed construction cone mascot animations
- June 26, 2025. Added main page loading screen featuring large Côney with app branding (2.5 second duration)
- June 26, 2025. Removed Côney loader from all loading states, keeping only hidden assistant for Easter egg discovery
- June 26, 2025. Extended loading screen duration to 3 seconds for better user experience
- June 26, 2025. Implemented passenger name-based document naming for POA, file uploads, invoices, and records
- June 26, 2025. Added meal vouchers field to claim forms with CAD amount validation and expense calculation adjustment
- June 26, 2025. Implemented APPR admissibility rules with Windows 98-style validation modal to prevent invalid claim submissions
- June 26, 2025. Created comprehensive consent management system with individual file generation for each checkbox consent
- June 26, 2025. Added systematic consent tracking with named files following ConsentType_FirstName_LastName_Email_ClaimID_Timestamp.json format
- June 26, 2025. Integrated APPR validation in both commission calculator and claim submission forms to reduce processing costs
- June 26, 2025. Prepared comprehensive deployment configuration with multiple platform options (Railway, Vercel, Render)
- June 26, 2025. Created Docker containerization and environment templates for production deployment
- June 26, 2025. Added deployment files for custom domain hosting outside .replit.app ecosystem
- June 26, 2025. Consolidated consent checkboxes into single comprehensive agreement with individual document links
- June 26, 2025. Simplified consent process while maintaining full transparency and document access
- October 6, 2026. Re-awakened outside Replit: email/password login (passport-local + scrypt) replaces Replit OpenID
- October 6, 2026. Switched database driver to standard pg so any PostgreSQL works; PORT read from environment
- October 6, 2026. Fixed claim submission (multipart booleans), single YUL Claim ID shared by database, consents and emails
- October 6, 2026. Compensation now computed from shared APPR rules (carrier size x delay band); calculator aligned with the claim form and guide
- October 6, 2026. Consent audit trail stored in the consent_records table (JSON copies kept as convenience)
- October 6, 2026. Admin routes protected and wired: payments, status updates, airline letter, invoice, marketing campaign, role changes, document downloads
- October 6, 2026. Public claim-status update and consent export endpoints locked down to admins
- October 6, 2026. Build no longer imports Vite in production; Dockerfile, Render and Railway configs fixed; Vercel config removed
- October 6, 2026. TypeScript check passes (was 25 errors); Replit dev banner removed from index.html
- October 6, 2026. Phase 1: single brand (DelayedFlightComp), French/English toggle on every passenger screen and consent document
- October 6, 2026. Phase 1: email verification, password reset, My Claims page, claims linked to accounts, prefilled claim form
- October 6, 2026. Phase 1: "I don't know" delay reason; inadmissible reasons warn but can be submitted for verification
- October 6, 2026. Phase 1: denied boarding priced at $900/$1,800/$2,400 by arrival delay; splash screen and invented statistic removed; signed unsubscribe link
- October 6, 2026. Phase 2: claim event log and admin claim detail page with timeline, notes, 30-day airline deadline, overdue flag and CTA escalation
- October 6, 2026. Phase 2: bilingual stage emails (received, sent to airline, escalated, approved, rejected, paid, invoice, POA signed) logged on the claim
- October 6, 2026. Phase 2: built-in Power of Attorney signature pad producing a stored PDF (pdf-lib), emailed to the passenger
- October 6, 2026. Phase 2: Stripe Checkout payment link for the commission with webhook; e-Transfer fallback
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
# FlightClaim Pro

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
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Connection Pooling**: Neon serverless connection pool
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Type Safety**: Shared schema definitions between client and server

## Key Components

### Claim Processing System
- Multi-step form with file upload capabilities
- Automated eligibility validation using OpenAI GPT-4o
- Commission calculation engine with transparent fee structure
- Status tracking with detailed history logging
- Power of Attorney (POA) integration via DocuSign

### External Service Integrations
- **OpenAI**: AI-powered claim eligibility validation and chatbot support
- **Airtable**: Alternative data storage and claim management
- **DocuSign**: Electronic signature for POA documents
- **Email Service**: Nodemailer for automated claim notifications
- **File Storage**: Local file system (designed for cloud migration)

### User Interface Features
- Responsive design with mobile-first approach
- Dark/light theme support with system preference detection
- Voice search capability for FAQ interactions
- Real-time commission calculator
- Claim tracking system with status visualization

## Data Flow

1. **Claim Submission**: User fills multi-step form with flight details and uploads supporting documents
2. **Validation**: OpenAI API validates claim eligibility and estimates compensation
3. **Storage**: Claim data stored in PostgreSQL with status history tracking
4. **External Sync**: Claim details optionally synced to Airtable for management
5. **POA Process**: If required, DocuSign handles electronic signature workflow
6. **Notifications**: Email confirmations and updates sent via Nodemailer
7. **Tracking**: Users can track claim status through dedicated interface

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
- **Error Overlay**: Replit-specific error modal integration

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit infrastructure
- **Database**: Requires PostgreSQL connection via DATABASE_URL environment variable

### Environment Configuration
- **Development**: `npm run dev` starts concurrent dev servers
- **Production**: `npm run build` then `npm run start`
- **Database Migrations**: `npm run db:push` applies schema changes

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
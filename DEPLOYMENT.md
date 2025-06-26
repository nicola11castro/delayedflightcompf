# FlightClaim Pro - Custom Domain Deployment Guide

## Overview
This guide covers deploying FlightClaim Pro to a custom domain using various hosting platforms that support full-stack applications with PostgreSQL databases.

## Recommended Deployment Platforms

### 1. Vercel (Recommended)
**Best for**: Simple deployment with custom domains
**Database**: Neon PostgreSQL (serverless)
**Cost**: Free tier available, custom domains included

#### Steps:
1. Connect GitHub repository to Vercel
2. Set up Neon PostgreSQL database
3. Configure environment variables in Vercel
4. Add custom domain in Vercel dashboard
5. Update DNS records at your domain provider

#### Required Environment Variables:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
NODE_ENV=production
```

### 2. Railway
**Best for**: Full-stack apps with databases
**Database**: PostgreSQL addon included
**Cost**: $5/month minimum

#### Steps:
1. Connect GitHub repository to Railway
2. Add PostgreSQL service
3. Configure environment variables
4. Add custom domain
5. Railway handles SSL automatically

### 3. Render
**Best for**: Simple full-stack deployment
**Database**: PostgreSQL addon available
**Cost**: Free tier available

#### Steps:
1. Connect GitHub repository
2. Create PostgreSQL database
3. Deploy web service
4. Configure custom domain
5. SSL handled automatically

### 4. DigitalOcean App Platform
**Best for**: Scalable production deployments
**Database**: Managed PostgreSQL
**Cost**: Starting at $5/month

## Custom Domain Configuration

### Step 1: Choose Your Domain
- Register domain with providers like Namecheap, GoDaddy, or Cloudflare
- Popular extensions: .com, .io, .app, .co

### Step 2: DNS Configuration
Add these DNS records at your domain provider:

```
Type: CNAME
Name: www
Value: [your-platform-url]

Type: A (or CNAME)
Name: @
Value: [platform-specific-value]
```

### Step 3: SSL Certificate
All recommended platforms provide automatic SSL certificates for custom domains.

## Database Migration

### Current Setup
- PostgreSQL database with existing schema
- User sessions stored in database
- Claims and FAQ data

### Migration Steps
1. Export current database schema using `npm run db:generate`
2. Set up new PostgreSQL instance on chosen platform
3. Run schema migrations: `npm run db:push`
4. Optionally migrate existing data

## Environment Variables for Production

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
SESSION_SECRET=your-long-random-string

# Application
NODE_ENV=production

# Optional: External Services
OPENAI_API_KEY=your-openai-key
GOOGLE_SHEETS_ID=your-sheets-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## Deployment Checklist

- [ ] Choose hosting platform
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Deploy application
- [ ] Set up custom domain
- [ ] Verify SSL certificate
- [ ] Test authentication flow
- [ ] Test admin functionality
- [ ] Configure Google Sheets export (optional)
- [ ] Set up monitoring/logging

## Cost Estimates

### Budget Option (~$5-10/month)
- Railway: $5/month (includes database)
- Domain: $10-15/year
- Total: ~$70-75/year

### Professional Option (~$20-30/month)
- DigitalOcean App Platform: $12/month
- Managed PostgreSQL: $15/month
- Domain: $10-15/year
- Total: ~$335-350/year

### Enterprise Option (~$50+/month)
- Custom server deployment
- Dedicated database
- CDN and advanced monitoring
- Total: $600+/year

## Deployment Files Created

The following configuration files are now ready for deployment:

- `vercel.json` - Vercel deployment configuration
- `railway.json` - Railway deployment configuration  
- `render.yaml` - Render deployment configuration
- `Dockerfile` - Docker containerization for any platform
- `.env.example` - Environment variables template
- `.dockerignore` - Docker build optimization

## Quick Start Deployment

### Option 1: Railway (Recommended for beginners)
1. Push code to GitHub repository
2. Connect GitHub repo to Railway
3. Railway auto-detects `railway.json` configuration
4. Add PostgreSQL service in Railway dashboard
5. Set environment variables from `.env.example`
6. Add custom domain in Railway settings
7. Deploy automatically with git push

### Option 2: Vercel + Neon (Best performance)
1. Push code to GitHub repository
2. Create Neon PostgreSQL database
3. Connect GitHub repo to Vercel
4. Configure environment variables in Vercel dashboard
5. Add custom domain in Vercel settings
6. Deploy with automatic builds

### Option 3: Render (Free tier available)
1. Push code to GitHub repository
2. Connect GitHub repo to Render
3. Render auto-detects `render.yaml` configuration
4. Configure environment variables
5. Add custom domain
6. Deploy with automatic SSL

## Required Environment Variables

Copy from `.env.example` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session security
- `NODE_ENV=production`
- Optional: OpenAI, Google Sheets, Email service keys

## Domain Configuration

1. **Purchase Domain**: Use providers like Namecheap, Cloudflare, or GoDaddy
2. **DNS Setup**: Point domain to your deployment platform
3. **SSL**: Automatic with all recommended platforms
4. **Test**: Verify custom domain loads your application

## Post-Deployment Checklist

- [ ] Application loads on custom domain
- [ ] Database connection works
- [ ] User authentication functions
- [ ] Claims submission works
- [ ] Admin dashboard accessible
- [ ] APPR validation functions
- [ ] Consent file generation works
- [ ] SSL certificate active

Your Windows 98-styled flight compensation platform is ready for production deployment with systematic consent management and APPR compliance!
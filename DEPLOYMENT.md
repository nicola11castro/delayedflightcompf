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

## Next Steps

1. **Choose Platform**: I recommend starting with Vercel + Neon for simplicity
2. **Prepare Repository**: Ensure code is in a GitHub repository
3. **Set Up Database**: Create Neon PostgreSQL instance
4. **Deploy**: Connect repository to chosen platform
5. **Configure Domain**: Add your custom domain
6. **Test**: Verify all functionality works on the new domain

Would you like me to help you with any specific platform or walk through the deployment process step by step?
# lole Restaurant OS - Infrastructure as Code

Terraform configurations for deploying and managing the lole Restaurant Operating System ("Toast for Addis Ababa").

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      lole Infrastructure                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Vercel     │    │  Supabase    │    │  Upstash     │     │
│  │  (Frontend)  │───▶│  (Backend)   │    │  (Redis)     │     │
│  │              │    │              │    │              │     │
│  │  - Next.js   │    │  - Postgres  │    │  - Rate      │     │
│  │  - Edge      │    │  - Auth      │    │    Limiting  │     │
│  │  - Serverless│    │  - Storage   │    │  - Sessions  │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
terraform/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── .gitignore             # Git ignore rules for Terraform
├── example.tfvars         # Example variables file
├── README.md              # This file
└── modules/
    ├── supabase/          # Supabase configuration
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── redis/             # Redis/Upstash configuration
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── vercel/            # Vercel configuration
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Prerequisites

1. **Terraform** >= 1.6.0 installed
2. **Supabase** account with a project
3. **Vercel** account (for frontend deployment)
4. **Upstash** account (for Redis) or AWS account (for ElastiCache)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/MakeMoneyOnly/lole.git
cd lole/terraform
```

### 2. Configure your environment

Copy the example variables file and fill in your values:

```bash
cp example.tfvars dev.tfvars
# Edit dev.tfvars with your configuration
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan and apply

```bash
# Preview changes
terraform plan -var-file="dev.tfvars"

# Apply changes
terraform apply -var-file="dev.tfvars"
```

## Environments

### Development

```bash
terraform apply -var-file="dev.tfvars"
```

### Staging

```bash
terraform apply -var-file="staging.tfvars"
```

### Production

```bash
terraform apply -var-file="production.tfvars"
```

## Workspace Management

Alternatively, use Terraform workspaces:

```bash
# Create workspaces
terraform workspace new development
terraform workspace new staging
terraform workspace new production

# Select workspace
terraform workspace select development

# Apply with workspace-specific variables
terraform apply -var-file="example.tfvars"
```

## Configuration Details

### Supabase Module

- **Database**: PostgreSQL 15
- **Auth**: Email/password authentication
- **Storage**:
    - `avatars` - User profile images (public)
    - `receipts` - Payment receipts (private)
    - `menu-images` - Menu item images (public)
- **Realtime**: Enabled for order updates

### Redis/Upstash Module

- **Development**: Upstash Redis (serverless)
- **Production**: AWS ElastiCache (cluster mode)
- **Rate Limiting**: API request rate limiting
- **Sessions**: User session storage

### Vercel Module

- **Framework**: Next.js 16 (App Router)
- **Node Version**: 20
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`

## Required Environment Variables

After running Terraform, configure these in your deployment platform:

### Vercel Project Settings

```
NEXT_PUBLIC_SUPABASE_URL=<from terraform output>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from terraform output>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard - keep secret!>
REDIS_REST_API_URL=<from terraform output or Upstash console>
REDIS_REST_API_TOKEN=<from terraform output or Upstash console>
```

## Security Considerations

1. **Never commit secrets**: Use `.gitignore` and environment variables
2. **Use separate projects**: Development, staging, and production should be isolated
3. **Enable RLS**: Row Level Security is enforced at the database level
4. **Rotate secrets**: Regularly rotate API keys and database passwords
5. **Use HTTPS**: All traffic should be encrypted in transit

## Database Migrations

Database schema is managed via Supabase migrations in `../supabase/migrations/`.
Terraform manages the Supabase project configuration, but database schema changes
should be done through migration files:

```bash
# Apply migrations via Supabase CLI
supabase db push

# Or apply specific migration
supabase db reset --db-url <your-database-url>
```

## Troubleshooting

### Terraform state issues

If you encounter state issues:

```bash
# Check current state
terraform show

# Refresh state from providers
terraform refresh -var-file="dev.tfvars"
```

### Provider authentication

Make sure you have the required credentials:

```bash
# Vercel
export VERCEL_TOKEN=your-vercel-token

# Supabase
# Auth is done via project reference

# AWS (for ElastiCache)
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Supabase Terraform Provider](https://supabase.com/docs/guides/infrastructure/terraform)
- [Vercel Terraform Provider](https://vercel.com/docs/infrastructure/terraform)
- [Upstash Documentation](https://upstash.com/docs)

## License

Proprietary - All rights reserved. See project root for details.

# FTM Web

Modern, SEO-optimized web application built with Next.js 15 and Payload CMS. Features a headless CMS architecture with full internationalization support, integrated payment processing, and affiliate management.

## 🚀 Tech Stack

- **[Next.js 15](https://nextjs.org/)** - App Router with React 19, Turbopack
- **[Payload CMS 3.x](https://payloadcms.com/)** - Headless CMS with PostgreSQL
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[TailwindCSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Composable UI primitives
- **[next-intl](https://next-intl.dev/)** - Internationalization (i18n)
- **[pnpm](https://pnpm.io/)** + **[Turborepo](https://turbo.build/)** - Monorepo management
- **[Biome](https://biomejs.dev/)** - Fast linting and formatting

## 📋 Prerequisites

- **Node.js** 20.x or later
- **pnpm** 9.x (install via `npm install -g pnpm`)
- **PostgreSQL** 14+ (for Payload CMS)
- **Git** for version control

## 🏃 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ftm-web

# Install dependencies
pnpm install
```

### 2. Environment Setup

Create `.env.local` in `apps/web/`:

```bash
# Database (Required)
POSTGRES_URI=postgresql://user:password@localhost:5432/ftm_web

# Payload CMS (Required)
PAYLOAD_SECRET=your-super-secret-key-min-32-chars

# Application URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# Optional: S3 Storage
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com

# Optional: Performance
DISABLE_PRICING_CACHE=false

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb ftm_web

# Payload CMS will auto-migrate on first run
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **CMS Admin**: [http://localhost:3001/admin](http://localhost:3001/admin)

## 📁 Project Structure

```
ftm-web/
├── apps/
│   └── web/                      # Main Next.js application
│       ├── src/
│       │   ├── app/              # Next.js App Router pages
│       │   │   ├── [locale]/    # Internationalized routes
│       │   │   ├── (payload)/   # Payload CMS admin UI
│       │   │   ├── api/         # API routes
│       │   │   └── actions/     # Server actions
│       │   ├── collections/      # Payload CMS collections
│       │   ├── globals/          # Payload global configs
│       │   ├── blocks/           # Reusable content blocks
│       │   ├── components/       # React components
│       │   ├── lib/              # Utility functions
│       │   ├── hooks/            # React hooks
│       │   ├── i18n/             # i18n configuration
│       │   └── locales/          # Translation files
│       ├── scripts/              # Utility scripts
│       │   ├── translate-*.ts   # Translation automation
│       │   └── import-*.ts      # Data import scripts
│       ├── public/               # Static assets
│       └── payload.config.ts     # Payload CMS config
├── docs/                         # Documentation
│   ├── features/                 # Feature documentation
│   ├── integrations/             # Integration guides
│   └── developer/                # Developer guides
├── database/                     # Database scripts
├── context/                      # Style guide & context
├── turbo.json                    # Turborepo config
└── biome.json                    # Biome linter config
```

## 🛠 Development Workflow

### Common Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm dev:web          # Start only web app (same as dev)
pnpm devs             # Start with HTTPS (experimental)

# Code Quality
pnpm check            # Run Biome (lint + format, auto-fix)
pnpm format           # Format code only
pnpm check-types      # TypeScript type checking

# Build
pnpm build            # Build for production (avoid during dev)

# CMS Data Scripts (in apps/web)
pnpm translate:payload  # Translate Payload content
pnpm import:mappings    # Import product mappings
pnpm import:payouts     # Import payout data
pnpm update:payouts     # Update existing payouts
pnpm woo:orders         # Fetch WooCommerce orders
```

### Type Safety

This project uses auto-generated types from Payload CMS:

- Types are auto-generated in `src/payload-types.ts`
- Import types from `@/payload-types`
- DO NOT manually create duplicate types

### Styling

- Uses Payload's default design system for CMS admin
- TailwindCSS for frontend components
- Server-side rendering for optimal SEO

## 🌍 Internationalization

Supported languages are configured in `i18n.config.ts`. The application uses:

- **next-intl** for translations
- **Route-based locale switching** (`/en`, `/es`, etc.)
- **Translation scripts** for automating content translation

### Translation Scripts

```bash
# Translate collections
./scripts/translate-collection.sh <collection-name>

# Translate all collections
./scripts/translate-all-collections.sh

# Translate global configs
./scripts/translate-all-globals.sh
```

See `scripts/README-translate-*.md` for detailed guides.

## 🔌 Key Integrations

- **Payment Processing**: BridgerPay, Paytiko, Confirmo
- **Affiliate Management**: AffiliateWP integration
- **Analytics**: PostHog, Hyros
- **Email**: Klaviyo events
- **Storage**: Cloudflare R2 for media uploads

See `docs/integrations/` for integration guides.

## 📊 Performance

### Caching Strategy

- **Pricing Cache**: In-memory cache for pricing data
  - Disable with `DISABLE_PRICING_CACHE=true`
  - See `docs/fixes/PRICING_CACHE.md` for details

### Build Optimization

⚠️ **Important**: Do not run `pnpm build` during active development as it can break the dev environment. Use `pnpm dev` exclusively for development.

## 🔒 Security

- Price calculations are server-side only
- Discount codes validated through secure endpoints
- See `docs/fixes/PRICE_SECURITY_STATUS.md`

## 📚 Documentation

- **Developer Guides**: `docs/developer/`
- **Feature Documentation**: `docs/features/`
- **Integration Guides**: `docs/integrations/`
- **Fixes & Solutions**: `docs/fixes/`

## 📦 Package Management

- **Primary**: Use `pnpm` for all operations
- Monorepo managed by Turborepo
- Dependencies pinned via `scripts/pin-deps.mjs`

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Database connection issues**
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

**Type errors after CMS changes**
- Restart dev server to regenerate `payload-types.ts`

**Translation script errors**
- Ensure `.env.local` has valid `POSTGRES_URI`
- Check that the collection/global exists in Payload

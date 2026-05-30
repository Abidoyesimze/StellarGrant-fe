# StellarGrants Protocol

> Decentralized, milestone-based grant management on the Stellar blockchain

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/rust-1.78%2B-orange.svg)](https://www.rust-lang.org/)
[![Soroban](https://img.shields.io/badge/soroban-25.0-blueviolet.svg)](https://soroban.stellar.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://img.shields.io/github/actions/workflow/status/Maxwell316/StellarGrant-fe/ci.yml?label=CI)](../../actions)

**StellarGrants Protocol** is an open-source, on-chain grant management system built with Soroban smart contracts (Rust) on the Stellar blockchain. It lets projects, DAOs, and organizations create milestone-gated grants with token escrow, decentralized reviewer voting, staking-based accountability, and sub-5-second finality — all without a trusted intermediary.

---

## Table of Contents

- [Overview](#overview)
- [Repository Layout](#repository-layout)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Smart Contracts](#smart-contracts)
- [Frontend](#frontend)
- [API Service](#api-service)
- [TypeScript Client SDK](#typescript-client-sdk)
- [Testing](#testing)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

StellarGrants solves a core problem in open-source and DAO grant programs: **how do you release funds fairly without a trusted intermediary?** The protocol encodes the entire grant lifecycle — creation, funding, milestone submission, reviewer voting, and payout — directly into a Soroban smart contract. Funds sit in on-chain escrow and are released only when a quorum of staked reviewers approves each milestone.

The system is composed of four packages in this monorepo:

| Package | Purpose |
|---------|---------|
| `stellargrant-contracts/` | Soroban smart contract (Rust → WASM) |
| `stellargrant-fe/` | Next.js 16 web app — primary user interface |
| `api/` | Express + TypeScript REST API with PostgreSQL |
| `client/` | `@stellargrants/client-sdk` — TypeScript SDK and CLI |

---

## Repository Layout

```
StellarGrant-fe/
├── stellargrant-contracts/     # Soroban smart contracts (Rust)
│   ├── contracts/
│   │   └── stellar-grants/
│   │       └── src/
│   │           ├── lib.rs          # Contract entry point & all public methods
│   │           ├── types.rs        # Grant, Milestone, Escrow, Error types
│   │           ├── storage.rs      # Ledger key/value access helpers
│   │           ├── events.rs       # On-chain event emission
│   │           └── reentrancy.rs   # Reentrancy guard
│   ├── tests/                  # Integration & fuzz tests
│   ├── BENCHMARK.md            # WASM size optimization notes
│   ├── ContributionGuide.md    # Contract-specific contribution guide
│   ├── COVERAGE.md             # Test coverage report
│   └── THREAT_MODEL.md         # Attack vector analysis
│
├── stellargrant-fe/            # Next.js 16 frontend
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Landing / grant discovery
│   │   ├── grants/             # Grant listing, detail, create, fund
│   │   ├── dashboard/          # Contributor dashboard
│   │   ├── leaderboard/        # Reputation leaderboard
│   │   ├── contributors/       # Contributor profiles
│   │   ├── milestones/         # Milestone views
│   │   ├── dispute/            # Dispute flow
│   │   ├── review/             # Review queue
│   │   ├── search/             # Search page
│   │   └── settings/           # User settings
│   ├── components/             # UI components (grants, milestones, wallet, layout)
│   ├── hooks/                  # React hooks (wallet, grants, IPFS, voting, etc.)
│   ├── lib/
│   │   ├── stellar/            # RPC client, contract wrapper, events, SDK adapter
│   │   ├── store/              # Zustand global state
│   │   ├── schemas/            # Zod validation schemas
│   │   └── utils/              # Shared utilities
│   ├── mock-server/            # Local mock API for offline development
│   ├── tests/                  # Vitest unit & component tests
│   └── e2e/                    # Playwright end-to-end tests
│
├── api/                        # Express REST API
│   └── src/
│       ├── entities/           # TypeORM entities (Grant, Milestone, User, etc.)
│       ├── routes/             # REST route handlers
│       ├── services/           # Business logic
│       ├── soroban/            # Contract integration helpers
│       ├── middlewares/        # Auth, rate-limit, validation
│       └── config/             # Environment config
│
├── client/                     # @stellargrants/client-sdk
│   └── src/
│       ├── StellarGrantsSDK.ts # Main SDK class
│       ├── types/              # Input/output types
│       ├── wallets/            # Wallet adapters
│       ├── composables/        # Vue composables (optional)
│       ├── ipfs.ts             # IPFS upload helper
│       └── cli.ts              # `sg` CLI entry point
│
├── docker-compose.yml          # API + PostgreSQL stack
├── SECURITY.md                 # Security policy
├── TUTORIAL.md                 # Step-by-step beginner tutorial
└── package.json                # Root scripts (migrations, db)
```

---

## Architecture

### System Overview

```
                          ┌─────────────────────────────────┐
                          │        Stellar Network           │
                          │  ┌───────────────────────────┐  │
                          │  │  StellarGrants Contract    │  │
                          │  │  (Soroban / WASM)          │  │
                          │  │  · grant_create            │  │
                          │  │  · grant_fund              │  │
                          │  │  · milestone_submit        │  │
                          │  │  · milestone_vote          │  │
                          │  │  · stake_to_review         │  │
                          │  │  · sign_release (multisig) │  │
                          │  └────────────┬──────────────┘  │
                          │               │ events           │
                          └───────────────┼─────────────────┘
                                          │
             ┌────────────────────────────┼────────────────────────┐
             │                            │                        │
    ┌────────┴────────┐          ┌────────┴────────┐    ┌─────────┴──────┐
    │  Next.js 16 App │          │  Express API     │    │  Client SDK    │
    │  (Browser)      │          │  (PostgreSQL)    │    │  (Node/Vue)    │
    │                 │          │                  │    │                │
    │  Direct RPC     │          │  Caching layer   │    │  Programmatic  │
    │  Freighter sign │          │  OAuth/JWT auth  │    │  contract calls│
    │  TanStack Query │          │  Webhooks        │    │  `sg` CLI      │
    │  Zustand state  │          │  Analytics       │    └────────────────┘
    └─────────────────┘          └──────────────────┘
```

### Core Design Principles

**Direct-to-Chain Frontend** — The Next.js app is the primary interface. For read operations and signed writes, the browser communicates directly with Stellar RPC. No dedicated backend is required for any core grant flow.

**Optional API Layer** — The `api/` service adds value for features that benefit from a database: user profiles with OAuth (GitHub, Twitter), caching, analytics, webhook delivery, leaderboard persistence, and email notifications. It is entirely optional for the core protocol to function.

**Escrow Lifecycle** — Funds move through well-defined states: `Funding → Active → Completed / Cancelled`. Each state transition requires authorization. Milestone payouts are atomic: approve → transfer → mark paid.

**Staking-Based Accountability** — Reviewers must stake tokens before voting. Malicious reviewers can be slashed by an admin. The staking amount is configurable, creating an economic deterrent against fraudulent approvals.

### Data Flow — Read Path

```
Next.js Server Component
        │
        ▼  simulateTransaction (read-only)
  Stellar RPC ──► Contract storage ──► scVal response
        │
        ▼  scValToNative
  React Component (hydrated with on-chain data)
```

### Data Flow — Write Path

```
React Component
        │
        ▼  build XDR
  ContractClient / SDK
        │
        ▼  signTransaction
  Freighter / xBull / Passkey (WebAuthn)
        │
        ▼  sendTransaction
  Stellar RPC ──► Soroban contract
        │
        ▼  contract events (streaming)
  useContractEvents hook ──► UI update
```

---

## Features

### Smart Contract

| Feature | Details |
|---------|---------|
| **Milestone grants** | Up to 100 milestones per grant; each has its own token amount, description, state, and submission proof URL |
| **Token escrow** | XLM, USDC, or any SEP-41 token; funds locked on-chain until milestone approval |
| **Quorum voting** | Threshold = `(reviewers / 2) + 1`; each reviewer casts an approve or reject vote with an optional reason |
| **Reviewer staking** | Reviewers stake tokens to earn voting rights; stake is slashable by admin for malicious behavior |
| **Multi-sig release** | `grant_complete` requires all designated signers to call `sign_release` before funds are unlocked |
| **High-security grants** | `grant_create_high_security` adds additional access controls for large-value grants |
| **Batch operations** | `milestone_submit_batch` and `fund_batch` reduce transaction costs for bulk actions |
| **Contributor profiles** | On-chain profiles with name, bio, skills, and a reputation score derived from milestone completions |
| **Identity oracle** | Configurable oracle address for off-chain identity verification integration |
| **Overflow safety** | All arithmetic uses `checked_add` / `checked_mul`; `overflow-checks = true` in release profile |
| **Reentrancy guard** | Explicit reentrancy protection on mutating contract methods |
| **WASM optimized** | 16.4 KB WASM binary after LTO, symbol stripping, and dead-code elimination (~9% smaller than baseline) |

### Frontend

| Feature | Details |
|---------|---------|
| **Zero-backend reads** | All grant state is read directly from Stellar RPC — no backend required |
| **Multi-wallet support** | Freighter, xBull, and Stellar Passkeys (WebAuthn / Secp256r1) |
| **Real-time events** | `useContractEvents` streams Soroban contract events via RPC subscription |
| **IPFS proofs** | Milestone proof documents are uploaded to IPFS (Pinata); URL stored on-chain |
| **Dispute flow** | Dedicated UI for raising and resolving grant disputes |
| **Review queue** | Reviewer dashboard with pending milestones, vote history, and staking controls |
| **Leaderboard** | Contributor reputation ranking derived from on-chain scores |
| **Grant search** | Full-text search with filters for status, token, and sort order |
| **Optimistic updates** | `useOptimisticGrant` provides instant UI feedback before tx confirmation |
| **Mock server** | `npm run dev:mock` spins up a local mock API for offline UI development |
| **QR codes** | Grant and profile pages expose QR codes for wallet address sharing |

### API Service

| Feature | Details |
|---------|---------|
| **OAuth login** | GitHub and Twitter login via Passport.js; JWT session tokens |
| **Rate limiting** | Per-route limits via `express-rate-limit` |
| **Security headers** | `helmet` middleware for CSP, HSTS, and X-Frame-Options |
| **Prometheus metrics** | `prom-client` exposes `/metrics` (IP-gated) |
| **Webhooks** | Subscribe to grant events via webhook; delivery logs persisted to PostgreSQL |
| **Email notifications** | SendGrid integration for milestone and grant status emails |
| **Redis caching** | `ioredis` for high-frequency read caching |
| **Socket.io** | Real-time push for grant activity feeds |
| **Swagger docs** | Auto-generated API documentation at `/api-docs` |
| **Migrations** | TypeORM migration runner; run with `npm run migration:run` |

### Client SDK (`@stellargrants/client-sdk`)

| Feature | Details |
|---------|---------|
| **`StellarGrantsSDK` class** | Typed wrappers for all contract read and write methods |
| **Wallet adapters** | Pluggable signer interface supporting Freighter, passkeys, and custom signers |
| **Vue composables** | Optional `vue` peer dependency for reactive composables in Vue 3 apps |
| **IPFS upload** | `ipfs.ts` helper for uploading milestone proof files |
| **`sg` CLI** | `npx @stellargrants/client-sdk` exposes a `sg` command for scripting contract interactions |
| **Error parsing** | `parseSorobanError` decodes `ContractError` codes into human-readable messages |
| **Pending XDR store** | `PendingXdrStore` holds partially-built transactions for multi-step signing flows |

---

## Prerequisites

### Smart Contract Development

- **Rust** stable toolchain (`rustup toolchain install stable`)
- **WASM target**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI**: `cargo install --locked stellar-cli --features opt`

### Frontend, API, and SDK

- **Node.js 20+** (the frontend uses Next.js 16 with React 19)
- **npm** (lockfiles are checked in under each sub-package)
- **Freighter** browser extension for wallet testing

### API Only

- **PostgreSQL 16** reachable via `DATABASE_URL`
- **Redis** (optional, for caching; ioredis)

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Maxwell316/StellarGrant-fe.git
cd StellarGrant-fe
```

### 2. Smart Contracts

```bash
cd stellargrant-contracts

# Install WASM target (once)
rustup target add wasm32-unknown-unknown

# Check formatting
cargo fmt --all -- --check

# Lint (deny warnings, WASM target)
cargo clippy --workspace --lib --target wasm32-unknown-unknown -- -D warnings

# Run unit tests (native target)
cargo test

# Build WASM binary
cd contracts/stellar-grants
make build
# Output: target/wasm32v1-none/release/stellar_grants.wasm
```

### 3. Frontend

```bash
cd stellargrant-fe

# Install dependencies
npm ci

# Copy environment file and configure
cp .env.local.example .env.local
# Edit .env.local — see Configuration section below

# Start development server (Turbopack)
npm run dev
# → http://localhost:3000

# Run with mock API server (no blockchain needed)
npm run dev:mock
```

### 4. API Service

```bash
cd api
npm ci

# Ensure PostgreSQL is running, then:
npm run dev
# → http://localhost:4000
# → Swagger UI: http://localhost:4000/api-docs
```

Alternatively, start the API and PostgreSQL together with Docker Compose:

```bash
# From the repository root
docker compose up
```

### 5. Client SDK

```bash
cd client
npm ci
npm run build      # Compile TypeScript to dist/
npm test           # Run Jest tests
node dist/cli.js   # Invoke the sg CLI
```

---

## Configuration

### Frontend Environment Variables

Create `stellargrant-fe/.env.local` (never commit this file). All `NEXT_PUBLIC_*` variables are exposed to the browser — do not put secrets there.

```env
# ── Stellar Network ──────────────────────────────────────────────────────────
NEXT_PUBLIC_STELLAR_NETWORK=testnet
# testnet | mainnet

NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
# Mainnet: https://soroban.stellar.org

NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
# Mainnet: Public Global Stellar Network ; September 2015

NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
# Mainnet: https://horizon.stellar.org

# ── Contract ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# The deployed StellarGrants contract address

# ── Tokens ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_NATIVE_TOKEN=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
# Native XLM wrapped contract (testnet)

NEXT_PUBLIC_USDC_TOKEN=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
# USDC contract (testnet — Circle / Stellar)

# ── IPFS (milestone proof uploads) ───────────────────────────────────────────
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
PINATA_API_KEY=your_pinata_api_key          # server-side only
PINATA_SECRET_KEY=your_pinata_secret_key    # server-side only

# ── Backend API (optional) ────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:4000

# ── Analytics (optional) ─────────────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### API Environment Variables

Create `api/.env` (never commit):

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stellargrant
NODE_ENV=development

# Stellar (for server-side contract calls)
CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# Metrics (IP allowlist and optional basic auth)
METRICS_ALLOWED_IPS=127.0.0.1
METRICS_BASIC_AUTH_USER=metrics
METRICS_BASIC_AUTH_PASSWORD=secret

# Admin
ADMIN_ADDRESSES=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Client SDK Configuration

```typescript
import { StellarGrantsSDK } from "@stellargrants/client-sdk";

const sdk = new StellarGrantsSDK({
  contractId: "CXXX...",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});
```

---

## Smart Contracts

### Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `initialize` | Write | One-time contract bootstrap |
| `set_global_admin` | Write | Rotate the global admin address |
| `grant_create` | Write | Create a standard milestone grant |
| `grant_create_high_security` | Write | Create a grant with elevated access controls |
| `grant_fund` | Write | Deposit tokens into grant escrow |
| `fund_batch` | Write | Batch-fund multiple grants in one transaction |
| `grant_cancel` | Write | Cancel a grant and trigger refunds |
| `grant_complete` | Write | Mark a grant completed after all milestones paid |
| `sign_release` | Write | Add a multi-sig signature to release escrow |
| `milestone_submit` | Write | Submit proof for a milestone |
| `milestone_submit_batch` | Write | Submit proofs for multiple milestones at once |
| `milestone_vote` | Write | Reviewer approves a milestone |
| `milestone_reject` | Write | Reviewer rejects a milestone with a reason |
| `contributor_register` | Write | Register an on-chain contributor profile |
| `stake_to_review` | Write | Stake tokens to earn reviewer rights on a grant |
| `unstake` | Write | Reclaim reviewer stake after grant ends |
| `slash_reviewer` | Write | Admin slashes a malicious reviewer's stake |
| `set_staking_config` | Write | Admin configures staking parameters |
| `set_identity_oracle` | Write | Admin sets the identity oracle address |
| `get_grant` | Read | Fetch a grant by ID |
| `get_milestone` | Read | Fetch a single milestone |
| `get_milestone_feedback` | Read | Fetch reviewer feedback for a milestone |

### Deploy to Testnet

```bash
cd stellargrant-contracts/contracts/stellar-grants

# Build
make build

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_grants.wasm \
  --network testnet \
  --source-account YOUR_SECRET_KEY

# Initialize
stellar contract invoke \
  --id CXXX... \
  --network testnet \
  --source-account YOUR_SECRET_KEY \
  -- initialize
```

### Deploy to Mainnet

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_grants.wasm \
  --network mainnet \
  --source-account YOUR_SECRET_KEY
```

Store keys outside the repository. Follow contract initialization steps after deploy. See [TUTORIAL.md](TUTORIAL.md) for a step-by-step end-to-end walkthrough with testnet accounts.

---

## Frontend

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack at `http://localhost:3000` |
| `npm run dev:mock` | Start dev server + local mock API concurrently |
| `npm run build` | Production build (webpack) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit and component tests in watch mode |
| `npm run test:run` | Run Vitest once (CI mode) |
| `npm run test:e2e` | Run Playwright end-to-end tests (headless) |
| `npm run test:e2e:headed` | Run Playwright tests with a visible browser |
| `npm run mock` | Start only the mock API server |

### Application Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — protocol stats and featured grants |
| `/grants` | Paginated grant listing with status, token, and sort filters |
| `/grants/create` | Multi-step grant creation form (wallet required) |
| `/grants/[id]` | Grant detail — metadata, funding progress, milestone list, event feed |
| `/grants/[id]/fund` | Token deposit flow into grant escrow |
| `/grants/[id]/milestones` | Milestone list for a grant |
| `/grants/[id]/history` | Transaction and event history for a grant |
| `/dashboard` | Contributor dashboard — active grants, pending milestones, earnings |
| `/leaderboard` | Top contributors ranked by on-chain reputation score |
| `/contributors/[address]` | Individual contributor profile |
| `/review` | Reviewer queue — pending milestones awaiting a vote |
| `/dispute` | Dispute submission and resolution flow |
| `/search` | Full-text grant search |
| `/settings` | User preferences and notification settings |

### Wallet Integration

The frontend supports three wallet methods:

**Freighter** (primary) — Browser extension. Uses `@stellar/freighter-api` for connection and XDR signing.

**xBull** — Alternative browser extension wallet.

**Stellar Passkeys** — WebAuthn / Secp256r1. Allows signing with device biometrics (Touch ID, Face ID, Windows Hello) without a seed phrase.

---

## API Service

The API is an optional service layer for features that require persistent storage or server-side logic.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production server |
| `npm run migration:run` | Apply pending TypeORM migrations |
| `npm run typeorm:sync` | Sync schema (development only) |
| `npm run test:e2e` | Run e2e tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:coverage` | Generate coverage report |

### Docker Compose

```bash
# Start API + PostgreSQL
docker compose up

# Rebuild after dependency changes
docker compose up --build
```

The Compose stack exposes:
- API: `http://localhost:4000`
- PostgreSQL: `localhost:5432` (user `postgres`, password `postgres`, db `stellargrant`)

### Key API Routes

| Path | Description |
|------|-------------|
| `GET /health` | Liveness probe |
| `GET /metrics` | Prometheus metrics (IP-gated) |
| `GET /api-docs` | Swagger UI |
| `GET /grants` | Cached grant listing |
| `GET /grants/:id` | Cached grant detail |
| `POST /milestone-proof` | Upload milestone proof metadata |
| `GET /leaderboard` | Persisted leaderboard data |
| `GET /auth/github` | GitHub OAuth initiation |
| `GET /auth/twitter` | Twitter OAuth initiation |
| `GET /notifications` | User notification feed |
| `POST /webhooks` | Register a webhook endpoint |

---

## TypeScript Client SDK

`@stellargrants/client-sdk` provides a typed, Node-compatible interface to the StellarGrants contract.

### Installation

```bash
npm install @stellargrants/client-sdk
```

### Usage

```typescript
import { StellarGrantsSDK } from "@stellargrants/client-sdk";

const sdk = new StellarGrantsSDK({
  contractId: "CXXX...",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});

// Create a grant
const xdr = await sdk.grantCreate({
  owner: "GXXX...",
  title: "My Grant",
  description: "Grant for open-source work",
  budget: BigInt(1000_0000000),
  deadline: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600),
  milestoneCount: 3,
});

// Fund a grant
await sdk.grantFund({
  grantId: 1,
  token: "CDLZFC3...",
  amount: BigInt(500_0000000),
});

// Submit a milestone
await sdk.milestoneSubmit({
  grantId: 1,
  milestoneIdx: 0,
  contributor: "GXXX...",
  proofUrl: "ipfs://Qm...",
});

// Vote on a milestone
await sdk.milestoneVote({
  grantId: 1,
  milestoneIdx: 0,
  reviewer: "GXXX...",
  approve: true,
});
```

### CLI (`sg`)

```bash
# Via npx
npx @stellargrants/client-sdk

# After local build
node client/dist/cli.js --help
```

---

## Testing

### Smart Contracts

```bash
cd stellargrant-contracts

# Unit tests (native target, fast)
cargo test

# Coverage report (requires cargo-tarpaulin)
cargo tarpaulin --workspace --lib \
  --target x86_64-unknown-linux-gnu \
  --engine llvm --out Xml

# Fuzz tests
cd fuzz
cargo fuzz run fuzz_grant_create
```

See [COVERAGE.md](stellargrant-contracts/COVERAGE.md) for current coverage data.

### Frontend

```bash
cd stellargrant-fe

# Unit & component tests (Vitest)
npm run test:run

# End-to-end tests (Playwright, headless)
npm run test:e2e

# View Playwright report
npm run test:e2e:report
```

### API

```bash
cd api

# Integration tests (uses Testcontainers — requires Docker)
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Client SDK

```bash
cd client
npm test   # Jest
```

---

## Deployment

### Frontend — Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Preview deploy
vercel

# Production deploy
vercel --prod
```

Configure environment variables in **Vercel → Project → Settings → Environment Variables**. Use testnet values for Preview environments and mainnet values for Production.

### API — Docker

```bash
# Build API image
docker build -t stellargrant-api ./api

# Run with environment variables
docker run -p 4000:4000 \
  -e DATABASE_URL=postgres://user:pass@host:5432/stellargrant \
  -e CONTRACT_ID=CXXX... \
  stellargrant-api
```

Or use the provided `docker-compose.yml` at the repository root for a complete local stack.

### API — Manual

```bash
cd api
npm ci
npm run build
npm start
```

---

## CI/CD

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

**Triggers:** Pull requests and pushes to `main`.

**Contracts job:**
- `cargo fmt --all -- --check` — formatting check
- `cargo clippy --workspace --lib --target wasm32-unknown-unknown -- -D warnings` — lint
- `cargo check --workspace --target wasm32-unknown-unknown` — type check

**Before opening a PR**, run the following locally:

```bash
# Frontend
cd stellargrant-fe && npm run lint && npm run build

# API
cd api && npm run build

# Contracts
cd stellargrant-contracts && cargo fmt --all -- --check && cargo test
```

---

## Security

### Threat Model

The contract addresses the following threat classes (see [`THREAT_MODEL.md`](stellargrant-contracts/THREAT_MODEL.md) for full analysis):

| Threat | Mitigation |
|--------|-----------|
| **Reviewer collusion** | Staking requirement; admin slashing; quorum threshold scales with reviewer count |
| **Escrow drain via overflow** | `checked_add` / `checked_mul` throughout; `overflow-checks = true` in release profile |
| **Gas exhaustion (unbounded loops)** | Milestones capped at 100; batch operations capped at 20; Soroban CPU limits |
| **Unauthorized state transitions** | `require_auth()` on all write methods; role checks before every mutation |
| **Reentrancy** | Explicit reentrancy guard on all token-transfer paths |

### Reporting Vulnerabilities

Report security vulnerabilities via [GitHub Security Advisories](https://github.com/Maxwell316/StellarGrant-fe/security/advisories) or by emailing the maintainers directly. All reports are addressed promptly.

### General Guidelines

- Never commit private keys, mnemonics, or production secrets to this repository.
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Do not place secrets there.
- Run `npm audit` in `stellargrant-fe/` and `api/` before submitting PRs. The CI pipeline runs `npm audit --audit-level=high` and fails on any high-severity finding.
- Review access control logic and numeric safety in every contract change.

---

## Contributing

Contributions are welcome. Please read the relevant guide before opening a PR:

- **Smart contracts:** [`stellargrant-contracts/ContributionGuide.md`](stellargrant-contracts/ContributionGuide.md) — formatting, clippy, test requirements, and Soroban-specific patterns.
- **Frontend:** [`stellargrant-fe/CONTRIBUTING.md`](stellargrant-fe/CONTRIBUTING.md) — branching strategy, commit format, Wave Program issue labels, and PR checklist.

### Wave Program

The StellarGrants frontend participates in the **Stellar Wave Program** on Drips. Issues labeled `drips-wave` are eligible for Wave Point rewards. See the contributing guide for details.

### Commit Convention

```
type(scope): short description

feat(contracts): add batch milestone submission
fix(frontend): correct escrow balance display on mobile
chore(api): bump typeorm to 0.3.28
```

---

## License

MIT License. See [LICENSE](LICENSE) for the full text.

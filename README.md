# ScholarVerify

> Prove scholarship eligibility without revealing your income — zero-knowledge threshold verification on Midnight.

## Live Demo

[PLACEHOLDER — will add after deploying frontend to Vercel]

## Contract Address

| Network | Address |
|---------|---------|
| Preprod | `PASTE_PREPROD_ADDRESS_HERE` |
| Preview | `b31933a86c47b9754714a5ebf0deee4111a3f121766183c8223183f27dc5495d` |

## What This Does

ScholarVerify is a privacy-preserving eligibility checker built on Midnight. An applicant's income never leaves their own machine — instead, a zero-knowledge circuit proves whether their income meets a scholarship program's threshold, and only that yes/no result is written to the public ledger.

This solves a real problem: scholarship and grant programs typically require applicants to disclose sensitive financial data to prove eligibility, creating privacy risk and discouraging honest applications. ScholarVerify lets a program verify eligibility with mathematical certainty, without ever seeing the applicant's actual income.

The frontend connects directly to the Lace wallet, lets an applicant enter their income locally in the browser, generates a zero-knowledge proof client-side, and submits only the eligibility result on-chain.

## Privacy Model

- **PUBLIC** (on-chain, visible to anyone): whether the applicant is `eligible` (true/false), and the `programId` they applied under.
- **PRIVATE** (private witness, never on-chain): the applicant's actual income figure.
- **What the user PROVES without revealing:** that their income is less than or equal to the program's threshold — without ever disclosing the specific number.

## Privacy Claim

An on-chain observer watching this contract can see that a `checkEligibility` call occurred, the `programId` involved, and the resulting `eligible` boolean (true or false). They cannot see the applicant's actual income figure, cannot infer how close the applicant was to the threshold, and cannot reconstruct the private computation — only that a valid zero-knowledge proof confirmed the threshold comparison was performed correctly.

## Tech Stack

- Midnight network, Compact language, Midnight.js SDK, DApp Connector API, React, Vite, TypeScript, Lace wallet, Node.js v22, Docker, Yarn, Vitest

## Prerequisites

- [Lace wallet](https://chromewebstore.google.com/) browser extension installed, configured for Midnight → Preprod
- Node.js v22 (use `nvm install 22 && nvm use 22`)
- Docker + Docker Compose
- Yarn (via Corepack: `corepack enable && corepack prepare yarn@1.22.22 --activate`)
- Compact compiler ([install instructions](https://docs.midnight.network/getting-started/installation))

## Setup

```bash
git clone https://github.com/Sus-Nexus07/scholar-verify.git
cd scholar-verify
nvm use
yarn install
compact compile contracts/scholarship-eligibility.compact contracts/managed/scholarship-eligibility
```

## Run Locally (Frontend)

```bash
yarn proof:up
yarn dev
```

Open `http://localhost:5173`, connect your Lace wallet (set to Preprod), and use the app to deploy or call the contract.

## Run Tests (Node CLI, Level 1 harness)

Local devnet:
```bash
yarn env:up
yarn test:local
yarn env:down
```

Preview network (requires a funded wallet — see `.env.preview.example`):
```bash
yarn proof:up
yarn test:preview
yarn proof:down
```

## Demo Video

[PLACEHOLDER — will add after recording: wallet connect + successful circuit call]

## Initial Idea

*Scholarship and grant programs require applicants to prove they meet eligibility criteria such as income thresholds, academic performance, or prior grant history. Today, that means exposing sensitive financial and academic data to reviewers who may mishandle or leak it, and it discourages honest applicants who don't want their real numbers on record. ScholarVerify solves this with a zero-knowledge circuit: applicants prove they meet a program's threshold without revealing the underlying figure, so reviewers get a verifiable yes/no answer instead of raw personal data. Starting with income-based scholarship eligibility, the long-term vision extends this same privacy-preserving verification model to academic credentials and course completion — letting institutions confirm what someone has achieved without exposing their full record.*

## Screenshots

**Successful compile output:**
![Compile output](docs/screenshots/compile-output.png)

**Contract deployed on Preview (Level 1):**
![Deploy output](docs/screenshots/deploy-output.png)
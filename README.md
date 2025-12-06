# Eco-Credit Sentinel

**ESG Risk Detection & Greenwashing Audit Platform**

Eco-Credit Sentinel is a Next.js application that detects greenwashing in corporate sustainability reports and calculates risk-based credit adjustments. It uses Apify Cloud for secure file storage and Python Actor execution, with LlamaParse for PDF parsing and GPT-4o-mini for forensic auditing.

## Features

- 🔒 **Secure Data Ingestion** - Upload confidential PDFs with automatic secure storage in Apify cloud storage
- 🤖 **Agent Dispatch** - Automated Python Actor execution on Apify Cloud
- 🔍 **Forensic Audit & Score** - Uses LlamaParse, Adversarial Search, and GPT-4o-mini Auditor to assign Greenwashing Risk Scores
- 💰 **Credit Adjustment Logic** - Proprietary financial model (Loan Covenant Logic) determines ESG term compliance
- 📊 **Financial Impact Delivered** - Real-time display of Rate Delta and Dollar Impact (penalty or savings)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Cloud Services**: Apify Cloud (Storage & Actor Execution)
- **AI/ML**: LlamaParse, GPT-4o-mini

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Apify account with:
  - API Token
  - Key-Value Store ID
  - Actor ID: `momentous_hill/greenwashing-detector-for-esgs`

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
APIFY_TOKEN=your_apify_api_token
APIFY_KEY_VALUE_STORE_ID=your_key_value_store_id
APIFY_ACTOR_ID=momentous_hill/greenwashing-detector-for-esgs  # Required: Your Apify Actor ID
```

### Getting Your Apify Credentials

1. **APIFY_TOKEN**: 
   - Sign in to [Apify Console](https://console.apify.com/)
   - Go to Settings → Integrations
   - Copy your API token

2. **APIFY_KEY_VALUE_STORE_ID**:
   - In Apify Console, go to Storage → Key-Value Stores
   - Create a new store or use an existing one
   - Copy the Store ID from the store details

3. **APIFY_ACTOR_ID**:
   - Format: `username/actor-name`
   - Required: `momentous_hill/greenwashing-detector-for-esgs`
   - This is the Actor ID that will be used for the audit process

## Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

## Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Building for Production

```bash
# Build the application
npm run build
# or
yarn build
# or
pnpm build

# Start production server
npm start
# or
yarn start
# or
pnpm start
```

## Deployment on Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel project settings:
   - `APIFY_TOKEN`
   - `APIFY_KEY_VALUE_STORE_ID`
   - `APIFY_ACTOR_ID` (required: `momentous_hill/greenwashing-detector-for-esgs`)
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

## Project Structure

```
eco-credit-sentinel/
├── app/
│   ├── api/
│   │   ├── audit/      # Audit trigger endpoint
│   │   ├── status/     # Status polling endpoint
│   │   └── upload/     # File upload endpoint
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/
│   ├── AnalysisStatus.tsx
│   ├── AuditResults.tsx
│   ├── Header.tsx
│   ├── LeafIcon.tsx
│   └── LeafSpinner.tsx
├── lib/
│   └── fintech-logic.ts  # Credit adjustment calculations
└── public/              # Static assets
```

## API Endpoints

### POST `/api/upload`
Uploads a PDF file to Apify Key-Value Store.

**Request**: `FormData` with `file` field (PDF)

**Response**:
```json
{
  "key": "uuid.pdf",
  "url": "https://api.apify.com/v2/key-value-stores/..."
}
```

### POST `/api/audit`
Triggers the Apify Actor to start the audit process.

**Request**:
```json
{
  "fileUrl": "https://...",
  "companyName": "Acme Corp",
  "loanAmount": 5000000
}
```

**Response**:
```json
{
  "runId": "actor-run-id",
  "status": "RUNNING"
}
```

### POST `/api/status`
Checks the status of an audit run and returns results when complete.

**Request**:
```json
{
  "runId": "actor-run-id",
  "loanAmount": 5000000,
  "baseRate": 0.05,
  "companyName": "Acme Corp"
}
```

**Response** (when complete):
```json
{
  "runId": "actor-run-id",
  "status": "SUCCEEDED",
  "datasetId": "dataset-id",
  "report": { ... },
  "adjustment": {
    "rateAdjustment": 0.01,
    "newRate": 0.06,
    "annualInterestPayment": 300000,
    "financialImpact": 50000,
    "loanAmount": 5000000,
    "baseRate": 0.05,
    "summary": "..."
  }
}
```

## How It Works

1. **Secure Data Ingestion**: User uploads PDF and specifies company name and loan amount. File is secured in Apify cloud storage.

2. **Agent Dispatch**: Python Actor is triggered on Apify Cloud with secure link, company name, and loan data.

3. **Forensic Audit & Score**: Actor uses LlamaParse to read PDF, runs Adversarial Search for scandals, and GPT-4o-mini Auditor assigns Greenwashing Risk Score.

4. **Credit Adjustment Logic**: Risk Score is fed into Loan Covenant Logic to determine ESG term compliance.

5. **Financial Impact Delivered**: System displays Rate Delta and Dollar Impact (penalty or savings).

## Why Not GPT/Gemini?

Eco-Credit Sentinel provides several advantages over generalist LLMs:

- **Integrity & Governance**: Audit-ready logs for regulatory compliance vs non-auditable chat logs
- **Output Reliability**: Pydantic-enforced JSON vs unreliable conversational text
- **Intelligence**: Forensic, adversarial search vs generic search
- **Data Ingestion**: Multimodal parsing for charts/tables vs blind to visual data
- **Scalability**: Scalable API for batch auditing vs single manual uploads

## License

Private - All rights reserved

## Support

For issues or questions, please open an issue on GitHub.

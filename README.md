<div align="center">

<img src="public/image_assets/logo/Color logo - no background.png" alt="REPA Logo" height="72" />

# REPA — Real Estate Property Analyzer

**Analyze any investment property in minutes.**  
Cap rate · Cash flow · ROI · AI risk scoring — all in one place.

[![Live](https://img.shields.io/badge/Live-repa.io-7c3aed?style=flat-square)](https://repa.io)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](#)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-auth%20%26%20db-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)

</div>

---

## Features

### Instant Property Analysis
Enter a property address and key financials. REPA calculates every metric an investor needs — in seconds, without a spreadsheet.

| Metric | Description |
|---|---|
| **Cap Rate** | Net operating income ÷ purchase price |
| **Monthly & Annual Cash Flow** | After mortgage, taxes, insurance, HOA, and reserves |
| **Cash-on-Cash Return** | Cash income ÷ total cash invested |
| **Net Operating Income (NOI)** | Gross income minus all operating expenses |
| **DSCR** | Debt-service coverage ratio for lender qualification |
| **Maximum Allowable Offer (MAO)** | What you should pay to hit your target return |
| **Required Investment** | Total capital needed including down payment and closing costs |

---

### AI Risk Scoring
Every analysis gets an AI-generated risk score from 0 to 100, rendered as a color-coded gauge.

- **0 – 33** — Low Risk (green)
- **34 – 66** — Medium Risk (amber)
- **67 – 100** — High Risk (red)

The score weighs cap rate, DSCR, repair cost exposure, and cash-on-cash return against market benchmarks.

---

### Final Verdict Callout
Each report opens with a highlighted verdict box — the first thing your eye lands on.

- ✅ **Strong Deal** — green callout
- ⚠️ **Marginal Deal** — amber callout
- 🚫 **Avoid** — red callout

---

### 4-Step Guided Analysis Form
A structured multi-step form that makes complex inputs feel simple.

1. **Property Details** — address, type, bedrooms, bathrooms, square footage
2. **Financials** — purchase price, ARV, monthly rent, taxes, insurance, HOA
3. **Operating Expenses** — vacancy rate, property management %, maintenance reserve %
4. **Loan Terms** — down payment, interest rate, loan term

**ZIP → City/State Autofill** — type a ZIP code and the city and state fill in automatically.  
**Auto-save Draft** — progress is saved after each step and restored within 24 hours.  
**Inline Validation** — field errors appear immediately beneath each input and clear as you type.

---

### Repair Estimate Breakdown
REPA generates a line-item repair estimate with Low / Mid / High cost scenarios, visualised as a range bar so you can see the best-case to worst-case spread at a glance.

---

### Financial Breakdown Table
Income and expense line items displayed in a structured four-column table — income category, income amount, expense category, expense amount — with right-aligned tabular figures and red-highlighted negatives.

---

### Saved Results Dashboard
Every analysis is saved to your account and displayed on the Results page with:

- **Color-coded deal quality borders** — green, amber, or red left border based on cap rate
- **Relative timestamps** — "Today", "Yesterday", "3 days ago", or formatted date
- **Search, sort, and filter toolbar** — filter by address, sort by date or cap rate, filter by deal quality
- **Delete with confirmation** — remove cards with a hover-revealed trash button

---

### PDF Export *(Enterprise)*
Enterprise users can download a full PDF report for any analysis directly from the detail view.

---

### Google Drive Link
Attach a Drive link to any analysis for quick access to photos, documents, and due-diligence files. Add or edit the link inline without leaving the detail view.

---

### MAO Copy to Clipboard
One-click copy of the Maximum Allowable Offer value. The button briefly confirms "Copied ✓" then resets.

---

### Subscription Plans

| | Free | Pro | Enterprise |
|---|---|---|---|
| Analyses / month | 3 | 20 | Unlimited |
| AI risk scoring | ✓ | ✓ | ✓ |
| Repair estimates | ✓ | ✓ | ✓ |
| PDF export | — | — | ✓ |
| Customer support | — | Email | Priority |
| Billing | $0 | $15 / mo | $39 / mo |

Annual billing available at a 20 % discount. Stripe-powered checkout and customer portal for plan changes, cancellations, and invoices.

---

### Security & Data Privacy
- 256-bit TLS encryption on all connections
- Data stored encrypted in Supabase (Postgres + Row Level Security)
- Stripe handles all payment processing — REPA never stores card details
- User data is never sold to third parties

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Auth & Database | Supabase (Postgres + RLS) |
| Payments | Stripe Checkout & Customer Portal |
| Deployment | Vercel |

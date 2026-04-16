# 🐋 Whale Tracker — On-Chain Intelligence Dashboard

A research project tracking the behavior of major Ethereum whale wallets around key market events. Built for CV/portfolio purposes to demonstrate on-chain data analysis skills.

**Live Demo**: _Deploy and add your link here_  
**Research Report**: Available inside the app at `/report`

---

## Project Overview

This tool analyzes 5 known whale wallets (Vitalik, Wintermute, Jump Trading, Alameda, Paradigm) and their transaction patterns around:
- FTX Collapse (Nov 2022)
- Ethereum Merge (Sep 2022)
- Bitcoin ETF Approval (Jan 2024)
- LUNA/Terra Crash (May 2022)

**Key research question**: Do whale wallet movements signal market direction before major events?

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Backend | Python, FastAPI, Uvicorn |
| Data | Etherscan API, public on-chain data |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Free Etherscan API key → [etherscan.io/apis](https://etherscan.io/apis)

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/whale-tracker.git
cd whale-tracker
```

---

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and add your Etherscan API key

# Start the server
python main.py
# API runs at http://localhost:8000
```

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# App runs at http://localhost:5173
```

---

## Project Structure

```
whale-tracker/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── etherscan.py     # Etherscan API wrapper
│   ├── analysis.py      # Behavioral analysis logic
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Dashboard, WalletDetail, EventAnalysis, Report
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — list of tracked whale wallets |
| `/wallet/:id` | Individual wallet detail — balance, tx history, activity charts |
| `/events` | Event analysis — whale behavior around 4 major events |
| `/report` | Full research report with methodology and findings |

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push to GitHub, connect repo to vercel.com
```

### Backend → Railway
```bash
# Push to GitHub
# Connect repo at railway.app
# Add ETHERSCAN_API_KEY as environment variable
```

---

## Research Findings (Summary)

- Pre-event transaction spikes (2–5x baseline) occurred in 3 of 4 events
- Accumulation patterns preceded the ETH Merge (positive catalyst)
- Systematic exchange transfers preceded FTX and LUNA crashes
- Mixed signals around Bitcoin ETF approval

See the full report at `/report` in the app.

---

## Limitations & Ethics

All data is sourced from the public Ethereum blockchain via Etherscan. No private data is used. Wallet attribution relies on publicly labeled addresses. This project is for educational and research purposes only — not financial advice.

---

## License

MIT

# Polymarket Copy Trader

Copy trade the most profitable traders on [Polymarket](https://polymarket.com) — the world's largest prediction market.

Monitor top traders' positions in real-time, detect new trades, and automatically mirror them from your own wallet. Includes a live web dashboard to watch everything happen.

![Dashboard Preview](https://img.shields.io/badge/dashboard-localhost:3333-blue?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript) ![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Features

- **Real-time trader monitoring** — polls Polymarket's API for new trades from any wallet address
- **Automatic copy trading** — mirrors BUY trades with configurable position sizing
- **Live web dashboard** — dark-themed UI with real-time updates via SSE
- **Dry-run mode** — simulate trades without spending money (enabled by default)
- **Safety controls** — price filters, max balance limits, minimum order validation
- **Zero shady dependencies** — only official Polymarket SDK, ethers.js, Express, and axios

## Dashboard

The built-in dashboard at `localhost:3333` shows:

- Bot status, uptime, and trade count
- All tracked traders with their positions, PnL, and recent activity
- Copy trade log with action status (executed / dry-run / skipped + reason)
- Start/Stop controls directly from the browser

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/polymarket-copy-trader.git
cd polymarket-copy-trader

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your wallet details and trader addresses

# Run in dry-run mode (no real money)
npm run dev

# Open dashboard
open http://localhost:3333
```

## Configuration

All config lives in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Your wallet private key (without 0x prefix) | *required* |
| `PROXY_WALLET` | Your Polymarket proxy wallet address | *required* |
| `TRADER_ADDRESSES` | Comma-separated trader addresses to copy | *required* |
| `COPY_AMOUNT_USD` | USD to spend per copy trade | `1` |
| `MAX_BALANCE_PERCENT` | Max % of balance to risk | `50` |
| `POLL_INTERVAL` | Seconds between checks | `30` |
| `DASHBOARD_PORT` | Web dashboard port | `3333` |
| `DRY_RUN` | Simulate without trading | `true` |

## Finding Traders to Copy

1. Go to the [Polymarket Leaderboard](https://polymarket.com/leaderboard)
2. Look for traders with high profit AND high volume (not just one lucky bet)
3. Click their profile to get their wallet address from the URL
4. Add addresses to `TRADER_ADDRESSES` in your `.env`

## Scripts

```bash
npm run dev             # Start bot + dashboard (development)
npm run build           # Compile TypeScript
npm start               # Start from compiled JS (production)
npm run check-traders   # Preview what tracked traders are doing
npm run check-balance   # Check your wallet balance
```

## Architecture

```
src/
├── index.ts                    # Entry point
├── config/env.ts               # Environment config
├── dashboard/
│   ├── botEngine.ts            # Core bot loop + state management
│   └── server.ts               # Express dashboard + SSE
├── services/
│   ├── traderMonitor.ts        # Detects new trades from tracked wallets
│   └── tradeExecutor.ts        # Executes copy trades with safety checks
├── utils/
│   ├── api.ts                  # Polymarket data API client
│   ├── clobClient.ts           # Polymarket CLOB client (order placement)
│   └── logger.ts               # File + console logging
└── scripts/
    ├── checkTraders.ts         # Standalone trader activity viewer
    └── checkBalance.ts         # Wallet balance checker
```

## How It Works

1. The bot polls Polymarket's public API every N seconds for each tracked trader
2. When a new BUY trade is detected, it creates a matching order with your configured amount
3. Safety checks filter out extreme prices (>$0.95 or <$0.05) and tiny orders
4. SELL trades are skipped by default to avoid accidental short positions
5. Everything is logged to the dashboard and `logs/` directory

## Safety

- **Dry-run by default** — you must explicitly set `DRY_RUN=false` to enable real trading
- **Price guards** — won't buy above $0.95 (nearly resolved) or below $0.05 (too risky)
- **Balance limits** — configurable max percentage of wallet to risk
- **No obfuscation** — every line of code is readable and auditable
- **Keys stay local** — your private key is only used locally to sign transactions

## Disclaimer

This software is for educational and research purposes. Trading on prediction markets involves risk of loss. Past performance of copied traders does not guarantee future results. You are solely responsible for your trading decisions. This is not financial advice.

## License

MIT

# solana-wallet-balances-api

Fetch Solana wallet token balances with on-chain RPC amounts, Vybe metadata, and USD pricing via Jupiter with pump.fun fallback (HTTP proxy pool supported).

Ported from [solana-quote-swap-api](https://github.com/) wallet balance and price resolution logic.

## Features

- **On-chain amounts** — SPL + Token-2022 + native SOL via Solana RPC (source of truth)
- **Vybe wallet API** — metadata and priced holdings when available
- **RPC-only holdings** — discovers mints Vybe missed, enriches via Jupiter → pump.fun → Vybe
- **HTTP proxy pool** — rotating proxy slots for Jupiter and pump.fun (IPRoyal-style `PROXY_HOST` + `PROXY_AUTH`)
- **Streaming** — NDJSON stream with `initial`, per-token `update`, and `done` events

## Setup

```bash
cp .env.example .env
# Set VYBE_DATA_API_KEY in .env

npm install
npm run dev
```

Default port: **3001** (`PORT` env to override).

## API

### `GET /health`

Service status and configured backends.

### `GET /api/wallets/:ownerAddress/token-balances`

| Query | Default | Description |
|-------|---------|-------------|
| `limit` | 500 | Max tokens (cap 500) |
| `stream` | false | `1` for NDJSON stream |
| `enrich` | true when streaming, false for JSON | Resolve missing prices/logos via Jupiter + pump.fun |

**JSON response:**

```json
{
  "tokens": [
    {
      "mintAddress": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Solana",
      "logoUrl": "/cached/token-icons/...",
      "decimals": 9,
      "amountUi": 1.5,
      "amountExact": "1500000000",
      "valueUsd": 225.0,
      "verified": true
    }
  ]
}
```

**Stream events** (`stream=1`):

```json
{"event":"initial","tokens":[...]}
{"event":"update","token":{...}}
{"event":"done"}
```

### `GET /api/token/:mint`

Resolve token metadata and USD price for a single mint.

| Query | Description |
|-------|-------------|
| `skipVybe` | `1` to skip Vybe token-details (wallet enrichment path) |

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VYBE_DATA_API_KEY` | Yes | Vybe API key for wallets/tokens |
| `VYBE_DATA_API_BASE` | No | Default `https://api.vybenetwork.xyz` |
| `HELIUS_API_KEY` / `SOLANA_RPC_URL` | No | Solana RPC for balance amounts |
| `PROXY_HOST` + `PROXY_AUTH` | No | HTTP proxy for Jupiter/pump.fun |
| `PUMPFUN_AUTH_TOKEN` | No | Optional pump.fun JWT |
| `HTTP_PROXY_WARMUP` | No | Warm Jupiter/pump.fun at startup (default on) |

## Deploy to VM

Production host: `https://solana-wallet-balances-api.vybenetwork.com` (port **3007** behind nginx).

Deploy scripts live in `scripts/` (gitignored locally, same as solana-quote-swap-api) with VM sshpass credentials embedded.

```bash
# First-time provision (nginx, certbot SSL, systemd)
npm run deploy:vm

# Quick redeploy (rsync + build + restart)
npm run redeploy:vm
```

`scripts/deploy-to-vm.sh` uploads `.env` from this repo or `~/Projects/solana-quote-swap-api/.env`. `scripts/redeploy-vm.sh` does not overwrite `.env` on the VM.

## License

MIT

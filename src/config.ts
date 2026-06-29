/**
 * Application configuration: env loading, API base URL, and constants.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/** Path to public static assets (web demo). */
export const PUBLIC_DIR = path.join(projectRoot, 'public');

dotenv.config({ path: path.join(projectRoot, '.env') });

export function loadEnv(): void {
  dotenv.config({ path: path.join(projectRoot, '.env') });
}

export function getDataApiKey(): string {
  const key = (process.env.VYBE_DATA_API_KEY ?? process.env.VYBE_API_KEY ?? '').trim();
  if (!key) {
    throw new Error(
      'VYBE_DATA_API_KEY is required. Get a key at https://vybe.fyi/api-pricing',
    );
  }
  return key;
}

export const VYBE_DATA_API_BASE = (
  process.env.VYBE_DATA_API_BASE ?? 'https://api.vybenetwork.xyz'
)
  .trim()
  .replace(/\/$/, '');

export const VYBE_TIMEOUT_MS = 60_000;
export const VYBE_MAX_RETRIES = 3;
export const VYBE_RETRY_DELAY_MS = 2000;

const PUBLIC_SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

export function resolveSolanaRpcUrl(): string {
  const explicit = (process.env.SOLANA_RPC_URL ?? '').trim();
  if (explicit) return explicit;
  const heliusKey = (process.env.HELIUS_API_KEY ?? '').trim();
  if (heliusKey) return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  return PUBLIC_SOLANA_RPC_URL;
}

export const SOLANA_RPC_URL = resolveSolanaRpcUrl();

export function getSolanaRpcProviderLabel(): string {
  if ((process.env.SOLANA_RPC_URL ?? '').trim()) return 'custom (SOLANA_RPC_URL)';
  if ((process.env.HELIUS_API_KEY ?? '').trim()) return 'Helius';
  return 'public mainnet';
}

export function getPumpfunAuthToken(): string | undefined {
  const token = (process.env.PUMPFUN_AUTH_TOKEN ?? '').trim();
  return token || undefined;
}

export function getPumpfunHeadersPath(): string | undefined {
  const raw = (process.env.PUMPFUN_HEADERS_PATH ?? '').trim();
  return raw || undefined;
}

export function getHttpProxyConfig():
  | { host: string; port: number; auth: { username: string; password: string }; protocol: 'http' }
  | undefined {
  const hostRaw = (process.env.PROXY_HOST ?? '').trim();
  const authRaw = (process.env.PROXY_AUTH ?? '').trim();
  if (!hostRaw || !authRaw) return undefined;

  const colonIdx = authRaw.indexOf(':');
  if (colonIdx <= 0) return undefined;

  const [hostname, portStr] = hostRaw.includes(':')
    ? hostRaw.split(':', 2)
    : [hostRaw, '80'];
  const port = Number(portStr) || 80;

  return {
    host: hostname,
    port,
    auth: {
      username: authRaw.slice(0, colonIdx),
      password: authRaw.slice(colonIdx + 1),
    },
    protocol: 'http',
  };
}

export function getHttpProxyUrl(): string | undefined {
  const cfg = getHttpProxyConfig();
  if (!cfg) return undefined;
  const { username, password } = cfg.auth;
  return `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cfg.host}:${cfg.port}`;
}

const HTTP_PROXY_POOL_SIZE_MAX = 10;

export function getHttpProxyPoolSize(): number {
  const raw = Number(process.env.HTTP_PROXY_POOL_SIZE ?? HTTP_PROXY_POOL_SIZE_MAX);
  const n = Number.isFinite(raw) ? Math.floor(raw) : HTTP_PROXY_POOL_SIZE_MAX;
  return Math.min(HTTP_PROXY_POOL_SIZE_MAX, Math.max(1, n));
}

export function isHttpProxyWarmupEnabled(): boolean {
  const v = (process.env.HTTP_PROXY_WARMUP ?? '').trim().toLowerCase();
  if (!v) return true;
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return true;
}

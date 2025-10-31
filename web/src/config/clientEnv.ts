const trimTrailingSlash = (value: string) => value.replace(/\/+$/u, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

const rawApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const rawSocketUrl = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
const rawSocketPath = (import.meta.env.VITE_SOCKET_PATH as string | undefined)?.trim();

export const clientEnv = {
  apiBaseUrl: rawApiBase ? trimTrailingSlash(rawApiBase) : '/api',
  socketUrl: rawSocketUrl ? trimTrailingSlash(rawSocketUrl) : undefined,
  socketPath: rawSocketPath ? ensureLeadingSlash(rawSocketPath) : '/socket.io',
} as const;

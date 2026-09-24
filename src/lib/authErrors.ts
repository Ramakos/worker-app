/**
 * Utility to reliably identify network errors, connection drops, and timeouts,
 * differentiating them from legitimate credential errors (wrong password/username).
 */

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isNetworkOrTimeoutError(error: unknown): boolean {
  if (isOffline()) return true;
  if (!error) return false;

  const status = (error as any)?.status ?? (error as any)?.statusCode;
  // HTTP status 0 (network abort/CORS block), 408 (timeout), 502/503/504 (gateway issues)
  if (status === 0 || status === 408 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const name = String((error as any)?.name || '').toLowerCase();
  if (name === 'authretryablefetcherror' || name === 'aborterror') {
    return true;
  }

  const raw = typeof error === 'string'
    ? error
    : String((error as any)?.message || (error as any)?.error_description || (error as any)?.details || '');
  const msg = raw.toLowerCase();

  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('net::err_') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('abort') ||
    msg.includes('connection refused') ||
    msg.includes('connection reset') ||
    msg.includes('offline') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('the internet connection appears to be offline') ||
    msg.includes('server is unreachable')
  );
}

export function parseAuthError(
  error: unknown,
  context?: {
    inputIdentifier?: string;
    method?: 'password' | 'pin';
  }
): string {
  if (isOffline()) {
    return 'You are currently offline. Please check your internet connection or Wi-Fi signal and try again.';
  }

  if (isNetworkOrTimeoutError(error)) {
    return 'Unable to reach the server due to poor or unstable internet. Please check your connection and try again.';
  }

  const raw = typeof error === 'string'
    ? error
    : String((error as any)?.message || (error as any)?.error_description || '');
  const msg = raw.toLowerCase();
  const status = (error as any)?.status;

  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    const isOnlyUsername = context?.inputIdentifier && !context.inputIdentifier.includes('@');
    if (isOnlyUsername) {
      return `Invalid credentials for "${context.inputIdentifier}". If this is a username, the staff directory may not have synced. Please enter your full registered email.`;
    }
    return 'Invalid email or password. Please verify your credentials.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Account email has not been confirmed. Please check your email or ask an administrator.';
  }

  if (msg.includes('user not found')) {
    return 'No account was found with these credentials.';
  }

  if (context?.method === 'pin') {
    return 'Invalid PIN. Please check your 4-digit PIN or use your password.';
  }

  return raw || 'Authentication failed. Please check your credentials and internet connection.';
}

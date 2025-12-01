/**
 * Get the base URL for the application
 * Uses NEXTAUTH_URL environment variable if set, otherwise constructs from request
 */
export function getBaseUrl(request?: Request): string {
  // Try NEXTAUTH_URL first
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Try AUTH_URL (alternative env var)
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }

  // Construct from request if available
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // Fallback (shouldn't happen in production)
  return "http://localhost:8950";
}


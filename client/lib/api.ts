const isProduction = process.env.NODE_ENV === 'production';

export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  if (!isProduction) {
    return 'http://localhost:10000';
  }

  throw new Error('NEXT_PUBLIC_API_URL is not configured for the client build.');
}

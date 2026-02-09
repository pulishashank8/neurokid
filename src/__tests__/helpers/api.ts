import { NextRequest } from 'next/server';
import { Session } from 'next-auth';

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { body, headers = {}, searchParams = {} } = options;

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const request = new NextRequest(urlObj, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

/**
 * Mock NextAuth getServerSession for testing
 * This function should be used with vi.mock() in tests
 */
export function mockGetServerSession(session: Session | null) {
  return async () => session;
}

/**
 * Parse NextResponse to JSON
 */
export async function parseResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Create authorization header with Bearer token (if needed)
 */
export function createAuthHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create a mock NextRequest with FormData for testing API routes that expect multipart data
 */
export function createFormDataRequest(
  method: string,
  url: string,
  formFields: Record<string, string | Blob>,
  headers: Record<string, string> = {}
): NextRequest {
  const formData = new FormData();
  Object.entries(formFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const urlObj = new URL(url, 'http://localhost:3000');

  return new NextRequest(urlObj, {
    method,
    body: formData,
    headers,
  });
}

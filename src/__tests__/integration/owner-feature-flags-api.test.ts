import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH } from '@/app/api/owner/feature-flags/route';
import { createMockRequest, parseResponse } from '../helpers/api';

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}));

describe('Owner Feature Flags API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns flags', async () => {
    const res = await GET(createMockRequest('GET', '/api/owner/feature-flags'));
    const data = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(data.flags).toBeDefined();
    expect(Array.isArray(data.flags)).toBe(true);
  });

  it('POST creates flag with key and name', async () => {
    const res = await POST(
      createMockRequest('POST', '/api/owner/feature-flags', {
        body: { key: 'test_new_flag', name: 'Test Flag', isEnabled: false },
      })
    );
    const data = await parseResponse(res);
    expect([200, 201, 409]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      expect(data.flag).toBeDefined();
      expect(data.flag.key).toBe('test_new_flag');
    }
  });

  it('returns 401 when not authenticated', async () => {
    const { isAdminAuthenticated } = await import('@/lib/admin-auth');
    vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);
    const res = await GET(createMockRequest('GET', '/api/owner/feature-flags'));
    expect(res.status).toBe(401);
  });
});

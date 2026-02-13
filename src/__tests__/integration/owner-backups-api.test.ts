import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/owner/backups/route';
import { createMockRequest, parseResponse } from '../helpers/api';

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}));

describe('Owner Backups API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns backup status', async () => {
    const res = await GET(createMockRequest('GET', '/api/owner/backups'));
    const data = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('lastBackup');
    expect(data).toHaveProperty('recoveryPoints');
    expect(data).toHaveProperty('backupHealth');
    expect(data).toHaveProperty('isStale');
  });

  it('POST records manual backup', async () => {
    const res = await POST(
      createMockRequest('POST', '/api/owner/backups', {
        body: { backupType: 'MANUAL', status: 'SUCCESS' },
      })
    );
    const data = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(data.event).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    const { isAdminAuthenticated } = await import('@/lib/admin-auth');
    vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);
    const res = await GET(createMockRequest('GET', '/api/owner/backups'));
    expect(res.status).toBe(401);
  });
});

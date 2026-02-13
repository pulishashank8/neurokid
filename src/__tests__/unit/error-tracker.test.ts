import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportError, flush, initErrorTracker } from '@/lib/error-tracker';

const fetchMock = vi.fn();

describe('Error Tracker', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;
  });

  describe('reportError', () => {
    it('should enqueue errors for batching', () => {
      reportError('JS_ERROR', 'Test error');
      flush();
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/owner/events/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test error'),
        })
      );
    });

    it('should include error type in payload', () => {
      reportError('NETWORK_FAILURE', 'Fetch failed');
      flush();
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0].errorType).toBe('NETWORK_FAILURE');
      expect(body.errors[0].message).toBe('Fetch failed');
    });

    it('should include optional metadata', () => {
      reportError('RAGE_CLICK', '3 clicks', {
        elementId: 'btn-submit',
        metadata: { count: 3 },
      });
      flush();
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.errors[0].elementId).toBe('btn-submit');
      expect(body.errors[0].metadata).toMatchObject({ count: 3 });
    });

    it('should batch multiple errors', () => {
      reportError('JS_ERROR', 'Error 1');
      reportError('JS_ERROR', 'Error 2');
      flush();
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.errors).toHaveLength(2);
    });
  });

  describe('flush', () => {
    it('should not call fetch when queue is empty', () => {
      flush();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should clear queue after flush', () => {
      reportError('JS_ERROR', 'Error');
      flush();
      flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('initErrorTracker', () => {
    it('should not throw in Node environment', () => {
      expect(() => initErrorTracker()).not.toThrow();
    });
  });
});

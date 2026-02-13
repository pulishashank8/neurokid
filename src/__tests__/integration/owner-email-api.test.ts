import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getEmail, POST as postEmail } from '@/app/api/owner/email/route';
import { GET as getTemplates, POST as postTemplates } from '@/app/api/owner/email/templates/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/mailer', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ id: 'test-id' }),
}));

const prisma = getTestPrisma();

describe('Owner Email API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/owner/email', () => {
    it('should return email history', async () => {
      const response = await getEmail(createMockRequest('GET', '/api/owner/email'));
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.emails).toBeDefined();
      expect(Array.isArray(data.emails)).toBe(true);
      expect(typeof data.total).toBe('number');
      expect(typeof data.page).toBe('number');
      expect(typeof data.limit).toBe('number');
    });

    it('should return 401 when not authenticated', async () => {
      const { isAdminAuthenticated } = await import('@/lib/admin-auth');
      vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);

      const response = await getEmail(createMockRequest('GET', '/api/owner/email'));
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/owner/email', () => {
    it('should return 400 when subject/body/recipientUserIds missing', async () => {
      const response = await postEmail(
        createMockRequest('POST', '/api/owner/email', {
          body: { subject: 'Test' },
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 when recipientUserIds is empty', async () => {
      const response = await postEmail(
        createMockRequest('POST', '/api/owner/email', {
          body: {
            subject: 'Test',
            body: '<p>Hello</p>',
            recipientUserIds: [],
          },
        })
      );
      expect(response.status).toBe(400);
    });

    it('should send email when valid user IDs provided', async () => {
      const user = await prisma.user.findFirst({ where: {}, select: { id: true } });
      if (!user) {
        console.warn('Skipping: no users in test DB');
        return;
      }

      const response = await postEmail(
        createMockRequest('POST', '/api/owner/email', {
          body: {
            subject: 'Test Subject',
            body: '<p>Test body</p>',
            recipientUserIds: [user.id],
          },
        })
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.status).toBe('SENT');
      expect(data.sentCount).toBeGreaterThanOrEqual(0);
      expect(data.total).toBe(1);

      const emailRecord = await prisma.ownerEmail.findUnique({
        where: { id: data.id },
        include: { recipients: true },
      });
      expect(emailRecord).toBeDefined();
      expect(emailRecord?.subject).toBe('Test Subject');
      expect(emailRecord?.recipientCount).toBe(1);
    });
  });

  describe('GET /api/owner/email/templates', () => {
    it('should return templates list', async () => {
      const response = await getTemplates();
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.templates).toBeDefined();
      expect(Array.isArray(data.templates)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const { isAdminAuthenticated } = await import('@/lib/admin-auth');
      vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);

      const response = await getTemplates();
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/owner/email/templates', () => {
    it('should create a template', async () => {
      const name = `test-template-${Date.now()}`;
      const response = await postTemplates(
        createMockRequest('POST', '/api/owner/email/templates', {
          body: {
            name,
            subject: 'Test Subject',
            body: '<p>Test body</p>',
            category: 'GENERAL',
          },
        })
      );
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.name).toBe(name);
      expect(data.subject).toBe('Test Subject');
      expect(data.body).toBe('<p>Test body</p>');

      await prisma.emailTemplate.delete({ where: { id: data.id } }).catch(() => {});
    });

    it('should return 400 when name/subject/body missing', async () => {
      const response = await postTemplates(
        createMockRequest('POST', '/api/owner/email/templates', {
          body: { name: 'x' },
        })
      );
      expect(response.status).toBe(400);
    });
  });
});

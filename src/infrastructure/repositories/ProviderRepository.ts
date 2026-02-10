import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IProviderRepository, ListProvidersQuery } from '@/domain/interfaces/repositories/IProviderRepository';
import { Provider, ProviderReview, ProviderClaimRequest, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class ProviderRepository implements IProviderRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Provider | null> {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });
    return provider ? this.toDomainProvider(provider) : null;
  }

  async findByExternalId(source: string, externalId: string): Promise<Provider | null> {
    const provider = await this.prisma.provider.findFirst({
      where: {
        externalSource: source as any,
        externalId,
      },
    });
    return provider ? this.toDomainProvider(provider) : null;
  }

  async list(query: ListProvidersQuery): Promise<PaginatedResult<Provider>> {
    const where: any = {};

    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.state) where.state = { equals: query.state, mode: 'insensitive' };
    if (query.zipCode) where.zipCode = query.zipCode;
    if (query.minRating) where.rating = { gte: query.minRating };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      data: providers.map(p => this.toDomainProvider(p)),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: total > query.offset + query.limit,
      },
    };
  }

  async searchNearby(latitude: number, longitude: number, radiusKm: number, limit: number): Promise<Provider[]> {
    // This is a simplified implementation. In production, you'd use PostGIS or similar.
    const providers = await this.prisma.provider.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      take: limit * 3, // Fetch more and filter
    });

    // Simple distance calculation (not accurate for large distances)
    const filtered = providers.filter(p => {
      if (!p.latitude || !p.longitude) return false;
      const dx = p.latitude - latitude;
      const dy = p.longitude - longitude;
      const distance = Math.sqrt(dx * dx + dy * dy) * 111; // Rough km conversion
      return distance <= radiusKm;
    });

    return filtered.slice(0, limit).map(p => this.toDomainProvider(p));
  }

  // Reviews
  async findReviewById(id: string): Promise<ProviderReview | null> {
    const review = await this.prisma.providerReview.findUnique({
      where: { id },
    });
    return review ? this.toDomainReview(review) : null;
  }

  async listReviews(providerId: string): Promise<ProviderReview[]> {
    const reviews = await this.prisma.providerReview.findMany({
      where: { providerId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map(r => this.toDomainReview(r));
  }

  async createReview(data: Omit<ProviderReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderReview> {
    const review = await this.prisma.providerReview.create({
      data: {
        providerId: data.providerId,
        authorId: data.authorId,
        rating: data.rating,
        content: data.content,
        status: 'ACTIVE',
        helpful: 0,
      },
    });
    return this.toDomainReview(review);
  }

  async updateReview(id: string, data: Partial<ProviderReview>): Promise<ProviderReview> {
    const review = await this.prisma.providerReview.update({
      where: { id },
      data: {
        rating: data.rating,
        content: data.content,
        helpful: data.helpful,
      },
    });
    return this.toDomainReview(review);
  }

  async deleteReview(id: string): Promise<void> {
    await this.prisma.providerReview.delete({
      where: { id },
    });
  }

  async hasReviewed(providerId: string, authorId: string): Promise<boolean> {
    const count = await this.prisma.providerReview.count({
      where: { providerId, authorId },
    });
    return count > 0;
  }

  // Claim Requests
  async findClaimById(id: string): Promise<ProviderClaimRequest | null> {
    const claim = await this.prisma.providerClaimRequest.findUnique({
      where: { id },
    });
    return claim ? this.toDomainClaim(claim) : null;
  }

  async findClaimByProviderAndUser(providerId: string, userId: string): Promise<ProviderClaimRequest | null> {
    const claim = await this.prisma.providerClaimRequest.findFirst({
      where: { providerId, requesterUserId: userId },
    });
    return claim ? this.toDomainClaim(claim) : null;
  }

  async listClaimsByProvider(providerId: string): Promise<ProviderClaimRequest[]> {
    const claims = await this.prisma.providerClaimRequest.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
    return claims.map(c => this.toDomainClaim(c));
  }

  async createClaim(data: Omit<ProviderClaimRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ProviderClaimRequest> {
    const claim = await this.prisma.providerClaimRequest.create({
      data: {
        providerId: data.providerId,
        requesterUserId: data.requesterUserId,
        message: data.message,
        status: 'PENDING',
      },
    });
    return this.toDomainClaim(claim);
  }

  async updateClaimStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<ProviderClaimRequest> {
    const claim = await this.prisma.providerClaimRequest.update({
      where: { id },
      data: {
        status: status as any,
        reviewedAt: new Date(),
      },
    });
    return this.toDomainClaim(claim);
  }

  // Admin operations
  async create(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider> {
    const created = await this.prisma.provider.create({
      data: {
        externalSource: 'MANUAL' as any,
        name: provider.name,
        phone: provider.phone,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zipCode: provider.zipCode,
        latitude: provider.latitude,
        longitude: provider.longitude,
        website: provider.website,
        email: provider.email,
        specialties: provider.specialties as any,
      },
    });
    return this.toDomainProvider(created);
  }

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    const provider = await this.prisma.provider.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        website: data.website,
        email: data.email,
        rating: data.rating,
        specialties: data.specialties as any,
      },
    });
    return this.toDomainProvider(provider);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.provider.delete({
      where: { id },
    });
  }

  private toDomainProvider(provider: any): Provider {
    return {
      id: provider.id,
      externalSource: provider.externalSource,
      externalId: provider.externalId ?? undefined,
      name: provider.name,
      phone: provider.phone ?? undefined,
      address: provider.address ?? undefined,
      city: provider.city ?? undefined,
      state: provider.state ?? undefined,
      zipCode: provider.zipCode ?? undefined,
      latitude: provider.latitude ?? undefined,
      longitude: provider.longitude ?? undefined,
      website: provider.website ?? undefined,
      email: provider.email ?? undefined,
      specialties: provider.specialties || [],
      rating: provider.rating ? Number(provider.rating) : undefined,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private toDomainReview(review: any): ProviderReview {
    return {
      id: review.id,
      providerId: review.providerId,
      authorId: review.authorId,
      rating: review.rating,
      content: review.content ?? undefined,
      status: review.status,
      helpful: review.helpful,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private toDomainClaim(claim: any): ProviderClaimRequest {
    return {
      id: claim.id,
      providerId: claim.providerId,
      requesterUserId: claim.requesterUserId,
      status: claim.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      message: claim.message ?? undefined,
      reviewedAt: claim.reviewedAt ?? undefined,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
    };
  }
}

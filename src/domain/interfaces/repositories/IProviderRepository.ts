import { Provider, ProviderReview, ProviderClaimRequest } from '@/domain/types';
import { PaginatedResult } from '@/domain/types';

export interface ListProvidersQuery {
  city?: string;
  state?: string;
  zipCode?: string;
  specialties?: string[];
  minRating?: number;
  search?: string;
  limit: number;
  offset: number;
}

export interface IProviderRepository {
  findById(id: string): Promise<Provider | null>;
  findByExternalId(source: string, externalId: string): Promise<Provider | null>;
  list(query: ListProvidersQuery): Promise<PaginatedResult<Provider>>;
  searchNearby(latitude: number, longitude: number, radiusKm: number, limit: number): Promise<Provider[]>;
  
  // Reviews
  findReviewById(id: string): Promise<ProviderReview | null>;
  listReviews(providerId: string): Promise<ProviderReview[]>;
  createReview(data: Omit<ProviderReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProviderReview>;
  updateReview(id: string, data: Partial<ProviderReview>): Promise<ProviderReview>;
  deleteReview(id: string): Promise<void>;
  hasReviewed(providerId: string, authorId: string): Promise<boolean>;
  
  // Claim Requests
  findClaimById(id: string): Promise<ProviderClaimRequest | null>;
  findClaimByProviderAndUser(providerId: string, userId: string): Promise<ProviderClaimRequest | null>;
  listClaimsByProvider(providerId: string): Promise<ProviderClaimRequest[]>;
  createClaim(data: Omit<ProviderClaimRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ProviderClaimRequest>;
  updateClaimStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<ProviderClaimRequest>;
  
  // Admin operations
  create(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider>;
  update(id: string, data: Partial<Provider>): Promise<Provider>;
  delete(id: string): Promise<void>;
}

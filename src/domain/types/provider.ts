export interface Provider {
  id: string;
  externalSource: string;
  externalId?: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  email?: string;
  specialties: string[];
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderReview {
  id: string;
  providerId: string;
  authorId: string;
  rating: number;
  content?: string;
  status: string;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderClaimRequest {
  id: string;
  providerId: string;
  requesterUserId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

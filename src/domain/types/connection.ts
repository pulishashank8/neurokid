export interface Connection {
  id: string;
  userA: string;
  userB: string;
  createdAt: Date;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
}

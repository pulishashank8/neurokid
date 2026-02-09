export interface Vote {
  id: string;
  userId: string;
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  value: number;
  createdAt: Date;
}

export interface VoteResult {
  voteScore: number;
  userVote: number;
}

export interface IVoteService {
  vote(userId: string, targetType: 'POST' | 'COMMENT', targetId: string, value: number): Promise<VoteResult>;
  removeVote(userId: string, targetType: 'POST' | 'COMMENT', targetId: string): Promise<VoteResult>;
  getUserVote(userId: string, targetType: 'POST' | 'COMMENT', targetId: string): Promise<number>;
}

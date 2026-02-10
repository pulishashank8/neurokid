import { describe, it, expect } from 'vitest';
import {
  createUserFixture,
  createProfileFixture,
  createUserWithProfile,
  createPostFixture,
  createCategoryFixture,
  createTagFixture,
  createCommentFixture,
  createVoteFixture,
  createBookmarkFixture,
  createNotificationFixture,
  createMessageFixture,
  createTherapySessionFixture,
  createDailyWinFixture,
  createEmergencyCardFixture,
  createAACItemFixture,
  createPostWithComments,
  createMany,
} from '../utils/fixtures';

describe('Test Fixtures', () => {
  describe('User Fixtures', () => {
    it('should create user with default values', () => {
      const user = createUserFixture();
      
      expect(user.id).toBeDefined();
      expect(user.email).toContain('@example.com');
      expect(user.emailVerified).toBe(true);
      expect(user.isBanned).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should allow overriding user properties', () => {
      const user = createUserFixture({
        email: 'custom@example.com',
        emailVerified: false,
        isBanned: true,
      });
      
      expect(user.email).toBe('custom@example.com');
      expect(user.emailVerified).toBe(false);
      expect(user.isBanned).toBe(true);
    });

    it('should create profile with default values', () => {
      const profile = createProfileFixture();
      
      expect(profile.id).toBeDefined();
      expect(profile.username).toBeDefined();
      expect(profile.displayName).toBeDefined();
      expect(profile.verifiedTherapist).toBe(false);
    });

    it('should create user with profile', () => {
      const { user, profile } = createUserWithProfile();
      
      expect(user.id).toBe(profile.userId);
      expect(profile.username).toBeDefined();
    });

    it('should allow customizing user with profile', () => {
      const { user, profile } = createUserWithProfile({
        user: { email: 'test@example.com' },
        profile: { displayName: 'Custom Name' },
      });
      
      expect(user.email).toBe('test@example.com');
      expect(profile.displayName).toBe('Custom Name');
    });
  });

  describe('Post Fixtures', () => {
    it('should create post with default values', () => {
      const post = createPostFixture();
      
      expect(post.id).toBeDefined();
      expect(post.title).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.status).toBe('ACTIVE');
      expect(post.viewCount).toBe(0);
      expect(post.voteScore).toBe(0);
    });

    it('should allow overriding post properties', () => {
      const post = createPostFixture({
        title: 'Custom Title',
        status: 'LOCKED',
        isAnonymous: true,
      });
      
      expect(post.title).toBe('Custom Title');
      expect(post.status).toBe('LOCKED');
      expect(post.isAnonymous).toBe(true);
    });

    it('should create category with slug from name', () => {
      const category = createCategoryFixture({ name: 'Test Category' });
      
      expect(category.name).toBe('Test Category');
      expect(category.slug).toBe('test-category');
    });

    it('should create tag with slug from name', () => {
      const tag = createTagFixture({ name: 'My Tag' });
      
      expect(tag.name).toBe('My Tag');
      expect(tag.slug).toBe('my-tag');
    });
  });

  describe('Comment Fixtures', () => {
    it('should create comment with default values', () => {
      const comment = createCommentFixture();
      
      expect(comment.id).toBeDefined();
      expect(comment.content).toBeDefined();
      expect(comment.status).toBe('ACTIVE');
      expect(comment.voteScore).toBe(0);
    });

    it('should allow parent comment relationship', () => {
      const parentComment = createCommentFixture();
      const reply = createCommentFixture({
        parentCommentId: parentComment.id,
      });
      
      expect(reply.parentCommentId).toBe(parentComment.id);
    });
  });

  describe('Vote Fixtures', () => {
    it('should create upvote by default', () => {
      const vote = createVoteFixture();
      
      expect(vote.value).toBe(1);
      expect(vote.targetType).toBe('POST');
    });

    it('should allow creating downvote', () => {
      const vote = createVoteFixture({ value: -1 });
      
      expect(vote.value).toBe(-1);
    });

    it('should allow vote on comment', () => {
      const vote = createVoteFixture({
        targetType: 'COMMENT',
        targetId: 'comment_123',
      });
      
      expect(vote.targetType).toBe('COMMENT');
      expect(vote.targetId).toBe('comment_123');
    });
  });

  describe('Bookmark Fixtures', () => {
    it('should create bookmark with default values', () => {
      const bookmark = createBookmarkFixture();
      
      expect(bookmark.id).toBeDefined();
      expect(bookmark.userId).toBeDefined();
      expect(bookmark.postId).toBeDefined();
    });
  });

  describe('Notification Fixtures', () => {
    it('should create notification with default values', () => {
      const notification = createNotificationFixture();
      
      expect(notification.id).toBeDefined();
      expect(notification.type).toBe('POST_COMMENT');
      expect(notification.isRead).toBe(false);
    });

    it('should allow marking as read', () => {
      const notification = createNotificationFixture({
        isRead: true,
        readAt: new Date(),
      });
      
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeInstanceOf(Date);
    });
  });

  describe('Message Fixtures', () => {
    it('should create message with default values', () => {
      const message = createMessageFixture();
      
      expect(message.id).toBeDefined();
      expect(message.content).toBeDefined();
      expect(message.isRead).toBe(false);
    });
  });

  describe('Therapy Session Fixtures', () => {
    it('should create therapy session with default values', () => {
      const session = createTherapySessionFixture();
      
      expect(session.id).toBeDefined();
      expect(session.childName).toBeDefined();
      expect(session.therapyType).toBe('SPEECH');
      expect(session.isEncrypted).toBe(true);
    });

    it('should allow different therapy types', () => {
      const types = ['ABA', 'OCCUPATIONAL', 'SPEECH', 'BEHAVIORAL'] as const;
      
      types.forEach((type) => {
        const session = createTherapySessionFixture({ therapyType: type });
        expect(session.therapyType).toBe(type);
      });
    });
  });

  describe('Daily Win Fixtures', () => {
    it('should create daily win with default values', () => {
      const win = createDailyWinFixture();
      
      expect(win.id).toBeDefined();
      expect(win.content).toBeDefined();
      expect(win.isShared).toBe(false);
    });
  });

  describe('Emergency Card Fixtures', () => {
    it('should create emergency card with default values', () => {
      const card = createEmergencyCardFixture();
      
      expect(card.id).toBeDefined();
      expect(card.childName).toBeDefined();
      expect(card.isEncrypted).toBe(true);
      expect(card.emergencyContact1Name).toBeDefined();
    });
  });

  describe('AAC Item Fixtures', () => {
    it('should create AAC item with default values', () => {
      const item = createAACItemFixture();
      
      expect(item.id).toBeDefined();
      expect(item.label).toBeDefined();
      expect(item.category).toBe('CORE');
      expect(item.isActive).toBe(true);
    });
  });

  describe('Collection Factories', () => {
    it('should create post with comments', () => {
      const { post, comments } = createPostWithComments(5);
      
      expect(post.id).toBeDefined();
      expect(comments).toHaveLength(5);
      expect(comments[0].postId).toBe(post.id);
    });

    it('should create many items using factory', () => {
      const users = createMany(10, (i) => createUserFixture({ email: `user${i}@test.com` }));
      
      expect(users).toHaveLength(10);
      expect(users[0].email).toBe('user0@test.com');
      expect(users[9].email).toBe('user9@test.com');
    });

    it('should create unique IDs for each fixture', () => {
      const posts = createMany(5, () => createPostFixture());
      const ids = posts.map(p => p.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('Fixture Immutability', () => {
    it('should not share state between fixtures', () => {
      const post1 = createPostFixture();
      const post2 = createPostFixture();
      
      post1.title = 'Modified';
      
      expect(post2.title).not.toBe('Modified');
    });

    it('should not share array references', () => {
      const post1 = createPostFixture();
      const post2 = createPostFixture();
      
      post1.images.push('new-image.jpg');
      
      expect(post2.images).not.toContain('new-image.jpg');
    });
  });
});

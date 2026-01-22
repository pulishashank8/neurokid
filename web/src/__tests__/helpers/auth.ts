import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  password: string;
  profile: {
    username: string;
  };
}

/**
 * Create a test user with credentials
 */
export async function createTestUser(
  email: string = 'test@example.com',
  password: string = 'password123',
  username: string = 'testuser'
): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      profile: {
        create: {
          username,
          displayName: username,
          bio: 'Test user bio',
        },
      },
    },
    include: {
      profile: true,
    },
  });

  return {
    id: user.id,
    email: user.email || '',
    password, // Return plain password for testing
    profile: {
      username,
    },
  };
}

/**
 * Create a moderator test user
 */
export async function createModeratorUser(
  email: string = 'mod@example.com',
  password: string = 'password123',
  username: string = 'moderator'
): Promise<TestUser> {
  const user = await createTestUser(email, password, username);

  // Add moderator role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'MODERATOR',
    },
  });

  return user;
}

/**
 * Create a mock NextAuth session for testing
 * This bypasses NextAuth and returns a session object for use in tests
 */
export function createMockSession(user: TestUser): Session {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.profile.username,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}

/**
 * Create test category
 */
export async function createTestCategory(
  name: string = 'Test Category',
  slug: string = 'test-category',
  description: string = 'Test category description',
  icon?: string,
  order?: number
) {
  return await prisma.category.create({
    data: {
      name,
      slug,
      description,
      icon,
      order,
    },
  });
}

/**
 * Create test tag
 */
export async function createTestTag(
  name: string = 'test-tag',
  slug: string = 'test-tag',
  color?: string
) {
  return await prisma.tag.create({
    data: {
      name,
      slug,
      color,
    },
  });
}

/**
 * Create test post
 */
export async function createTestPost(
  authorId: string,
  categoryId: string,
  overrides: Partial<{
    title: string;
    content: string;
    isAnonymous: boolean;
    status: string;
  }> = {}
) {
  return await prisma.post.create({
    data: {
      title: overrides.title || 'Test Post Title',
      content: overrides.content || '<p>Test post content</p>',
      authorId,
      categoryId,
      isAnonymous: overrides.isAnonymous || false,
      status: (overrides.status as any) || 'ACTIVE',
      voteScore: 0,
    },
    include: {
      category: true,
      author: {
        include: {
          profile: true,
        },
      },
    },
  });
}

/**
 * Create test comment
 */
export async function createTestComment(
  authorId: string,
  postId: string,
  content: string = '<p>Test comment</p>',
  parentCommentId?: string
) {
  return await prisma.comment.create({
    data: {
      content,
      authorId,
      postId,
      parentCommentId,
      isAnonymous: false,
      status: 'ACTIVE',
      voteScore: 0,
    },
    include: {
      author: {
        include: {
          profile: true,
        },
      },
    },
  });
}

/**
 * Get a seeded category by slug (avoids creating duplicates)
 */
export async function getSeededCategory(slug: string = 'general-discussion') {
  const category = await prisma.category.findFirst({
    where: { slug }
  });

  if (!category) {
    throw new Error(`Seeded category '${slug}' not found. Available: general-discussion', diagnosis, therapies, education`);
  }

  return category;
}

/**
 * Get a seeded tag by slug (avoids creating duplicates)
 */
export async function getSeededTag(slug: string = 'autism') {
  const tag = await prisma.tag.findFirst({
    where: { slug }
  });

  if (!tag) {
    throw new Error(`Seeded tag '${slug}' not found. Available: autism, adhd, sensory, education, behavior`);
  }

  return tag;
}

import { vi } from 'vitest';

// All shared state and the main Prisma mock must be hoisted together
// to ensure they are available to other hoisted vi.mock calls.
const {
  mockTokens,
  mockVerificationTokens,
  mockUsers,
  mockBookmarks,
  mockPosts,
  mockComments,
  mockVotes,
  mockTags,
  mockResources,
  mockCategories,
  mockUserRoles,
  mockReports,
  mockModerationActions,
  mockModActionLogs,
  mockAIConversations,
  mockAIMessages,
  mockProviders,
  mockUserFinders,
  mockDailyWins,
  mockTherapySessions,
  mockEmergencyCards,
  mockSavedRhymes,
  mockPrisma
} = vi.hoisted(() => {
  const tokens: any[] = [];
  const verificationTokens: any[] = [];
  const users: any[] = [];
  const userRoles: any[] = [];
  const bookmarks: any[] = [];
  const posts: any[] = [];
  const comments: any[] = [];
  const votes: any[] = [];
  const tags: any[] = [];
  const resources: any[] = [];
  const categories: any[] = [];
  const reports: any[] = [];
  const moderationActions: any[] = [];
  const modActionLogs: any[] = [];
  const aiConversations: any[] = [];
  const aiMessages: any[] = [];
  const providers: any[] = [];
  const userFinders: any[] = [];
  const dailyWins: any[] = [];
  const therapySessions: any[] = [];
  const emergencyCards: any[] = [];
  const savedRhymes: any[] = [];

  const prismaMock: any = {
    category: {
      createMany: vi.fn().mockResolvedValue({ count: 4 }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(categories)),
      findFirst: vi.fn().mockImplementation((args: any) =>
        Promise.resolve(categories.find(c => c.slug === args.where?.slug || c.id === args.where?.id) || categories[0] || null)
      ),
      create: vi.fn().mockImplementation((args: any) => {
        const c = { id: args.data.id || `c_${categories.length + 1}`, ...args.data, _count: { posts: 0 } };
        categories.push(c);
        return Promise.resolve(c);
      }),
      findUnique: vi.fn().mockImplementation((args: any) =>
        Promise.resolve(categories.find(c => c.id === args.where.id || c.slug === args.where.slug) || null)
      ),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
      delete: vi.fn().mockResolvedValue({ id: 'c1' }),
      deleteMany: vi.fn().mockImplementation(() => {
        categories.length = 0;
        return Promise.resolve({ count: 1 });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: args.where.id || 'c1', ...args.create })
      ),
    },
    tag: {
      createMany: vi.fn().mockResolvedValue({ count: 4 }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(tags || [])),
      findFirst: vi.fn().mockImplementation((args: any) =>
        Promise.resolve(tags.find(t => t.id === args?.where?.id || t.slug === args?.where?.slug) || tags[0] || null)
      ),
      create: vi.fn().mockImplementation((args: any) => {
        const t = { id: args.data.id || `t_${tags.length + 1}`, ...args.data };
        tags.push(t);
        return Promise.resolve(t);
      }),
      findUnique: vi.fn().mockImplementation((args: any) =>
        Promise.resolve(tags.find(t => t.id === args.where.id || t.slug === args.where.slug) || null)
      ),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
      delete: vi.fn().mockResolvedValue({ id: 't1' }),
      deleteMany: vi.fn().mockImplementation(() => {
        tags.length = 0;
        return Promise.resolve({ count: 1 });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: args.where.id || 't1', ...args.create })
      ),
    },
    user: {
      findUnique: vi.fn().mockImplementation((args: any) => {
        const user = users.find(u => u.id === args?.where?.id || u.email === args?.where?.email);
        return Promise.resolve(user || null);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const user = users.find(u => u.id === args?.where?.id || u.email === args?.where?.email);
        return Promise.resolve(user || null);
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = users;
        if (args?.where) {
          list = users.filter(u => {
            if (args.where.email && u.email !== args.where.email) return false;
            if (args.where.id) {
              // Handle id.in case
              if (args.where.id.in) {
                if (!args.where.id.in.includes(u.id)) return false;
              }
              // Handle direct id match
              else if (typeof args.where.id === 'string' && u.id !== args.where.id) {
                return false;
              }
            }
            return true;
          });
        }
        if (args?.take) list = list.slice(0, args.take);

        // Handle include parameter
        if (args?.include) {
          list = list.map(user => {
            const result = { ...user };
            if (args.include.userRoles) {
              result.userRoles = userRoles.filter((ur: any) => ur.userId === user.id);
            }
            // profile is already on user object from creation
            return result;
          });
        }

        return Promise.resolve(list);
      }),
      count: vi.fn().mockImplementation(() => Promise.resolve(users.length)),
      create: vi.fn().mockImplementation((args: any) => {
        if (users.find(u => u.email === args?.data?.email)) {
          return Promise.reject(new Error('P2002: Unique constraint failed on the fields: (`email`)'));
        }
        const id = args?.data?.id || `u_${users.length + 1}`;
        const user = {
          id,
          ...args?.data,
          profile: args?.data?.profile?.create || { username: args?.data?.username || 'user' },
          userRoles: args?.data?.userRoles?.create ? [args.data.userRoles.create] : (args?.data?.userRoles || [])
        };
        users.push(user);
        // Also populate userRoles store if they were passed in
        if (args?.data?.userRoles?.create) {
          userRoles.push({ id: `ur_${userRoles.length + 1}`, userId: id, ...args.data.userRoles.create });
        }
        return Promise.resolve(user);
      }),
      update: vi.fn().mockImplementation((args: any) => {
        const user = users.find(u => u.id === args?.where?.id);
        if (user) Object.assign(user, args?.data || {});
        return Promise.resolve(user || { id: args?.where?.id, ...args?.data });
      }),
      delete: vi.fn().mockImplementation((args: any) => {
        const index = users.findIndex(u => u.id === args?.where?.id);
        if (index !== -1) users.splice(index, 1);
        return Promise.resolve({ id: args?.where?.id });
      }),
      deleteMany: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.email) {
          const index = users.findIndex(u => u.email === args.where.email);
          if (index !== -1) users.splice(index, 1);
        } else {
          users.length = 0;
        }
        return Promise.resolve({ count: 1 });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args?.where?.id || 'u1', ...args?.create })),
    },
    userRole: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = userRoles;
        if (args?.where?.userId) list = list.filter(ur => ur.userId === args.where.userId);
        if (args?.where?.role?.in) list = list.filter(ur => args.where.role.in.includes(ur.role));
        else if (args?.where?.role) list = list.filter(ur => ur.role === args.where.role);
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const ur = { id: `ur_${userRoles.length + 1}`, ...args.data };
        userRoles.push(ur);
        return Promise.resolve(ur);
      }),
      deleteMany: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.userId) {
          const indices = userRoles.map((ur, i) => ur.userId === args.where.userId ? i : -1).filter(i => i !== -1).reverse();
          indices.forEach(i => userRoles.splice(i, 1));
        } else {
          userRoles.length = 0;
        }
        return Promise.resolve({ count: 1 });
      }),
      delete: vi.fn().mockResolvedValue({ id: 'r1' }),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args?.where?.id, ...args?.data })),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const where = args?.where?.userId_role || args?.where;
        const ur = userRoles.find(ur => ur.userId === where.userId && ur.role === where.role);
        return Promise.resolve(ur || null);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const ur = userRoles.find(ur => {
          if (args?.where?.userId && ur.userId !== args.where.userId) return false;
          const searchRoles = args?.where?.role?.in || (args?.where?.role ? [args.where.role] : null);
          if (searchRoles && !searchRoles.includes(ur.role)) return false;
          return true;
        });
        return Promise.resolve(ur || null);
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: args?.where?.id || 'r1', ...args?.create })
      ),
    },
    profile: {
      create: vi.fn().mockResolvedValue({ id: 'p1' }),
      findMany: vi.fn().mockImplementation((args: any) => {
        const profiles = users.filter(u => u.profile).map(u => u.profile);
        if (args?.take) return Promise.resolve(profiles.slice(0, args.take));
        return Promise.resolve(profiles);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const user = users.find(u =>
          (args.where.userId && u.id === args.where.userId) ||
          (args.where.username && u.profile?.username === args.where.username)
        );
        return Promise.resolve(user ? user.profile : null);
      }),
      update: vi.fn().mockImplementation((args: any) => {
        const user = users.find(u => u.id === args?.where?.userId || u.id === args?.where?.id);
        if (user) {
          if (!user.profile) user.profile = {};
          Object.assign(user.profile, args?.data || {});
          return Promise.resolve(user.profile);
        }
        return Promise.resolve({ userId: args?.where?.userId, ...args?.data });
      }),
      delete: vi.fn().mockResolvedValue({ id: 'p1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: args?.where?.id || 'p1', ...args?.create })
      ),
    },
    post: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = [...posts].filter(p => {
          if (args?.where?.categoryId && p.categoryId !== args.where.categoryId) return false;
          if (args?.where?.authorId && p.authorId !== args.where.authorId) return false;
          if (args?.where?.status && p.status !== args.where.status) return false;
          if (args?.where?.title && !p.title.includes(args.where.title)) return false;
          return true;
        });

        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (args?.orderBy?.createdAt === 'asc') {
          list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        return Promise.resolve(list);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        let list = posts.filter(p => {
          if (args?.where?.id && p.id !== args.where.id) return false;
          if (args?.where?.categoryId && p.categoryId !== args.where.categoryId) return false;
          if (args?.where?.authorId && p.authorId !== args.where.authorId) return false;
          if (args?.where?.title && p.title !== args.where.title) return false;
          if (args?.where?.status && p.status !== args.where.status) return false;
          return true;
        });
        const post = list[0] || null;
        if (!post) return Promise.resolve(null);

        // Handle include parameter
        if (args?.include) {
          const result = { ...post };
          if (args.include.comments) {
            result.comments = comments.filter(c => c.postId === post.id);
            if (args.include.comments.include?.author) {
              result.comments = result.comments.map((c: any) => ({
                ...c,
                author: users.find(u => u.id === c.authorId) || { id: c.authorId, profile: { username: 'unknown' } }
              }));
            }
          }
          if (args.include.author) {
            result.author = users.find(u => u.id === post.authorId) || { id: post.authorId, profile: { username: 'unknown' } };
          }
          if (args.include.category) {
            result.category = categories.find(c => c.id === post.categoryId) || { id: post.categoryId, name: 'Unknown', slug: 'unknown' };
          }
          if (args.include.bookmarks) {
            result.bookmarks = bookmarks.filter(b => b.postId === post.id);
          }
          return Promise.resolve(result);
        }
        return Promise.resolve(post);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        // Enforce basic foreign key constraints for E2E tests
        if (args?.data?.authorId && !users.find(u => u.id === args.data.authorId)) {
          return Promise.reject(new Error('P2003: Foreign key constraint failed on the field: (`authorId`)'));
        }
        if (args?.data?.categoryId && !categories.find(c => c.id === args.data.categoryId)) {
          return Promise.reject(new Error('P2003: Foreign key constraint failed on the field: (`categoryId`)'));
        }

        const p = {
          id: `p_${posts.length + 1}`,
          ...args?.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          commentCount: 0,
          voteScore: 0,
          _count: { comments: 0, votes: 0 },
          category: categories.find(c => c.id === args?.data?.categoryId) || { id: 'c1', name: 'General', slug: 'general' },
          tags: [],
          author: users.find(u => u.id === args?.data?.authorId) || { id: args?.data?.authorId || 'u1', profile: { username: 'user' } }
        };
        posts.push(p);
        return Promise.resolve(p);
      }),
      count: vi.fn().mockImplementation((args: any) => {
        const list = posts.filter(p => !args?.where?.categoryId || p.categoryId === args.where.categoryId);
        return Promise.resolve(list.length);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const id = args?.where?.id;
        if (!id) return Promise.resolve(null);
        const post = posts.find(p => p.id === id);
        if (!post) return Promise.resolve(null);

        // Handle include parameter
        if (args?.include) {
          const result = { ...post };
          if (args.include.comments) {
            result.comments = comments.filter(c => c.postId === post.id);
            if (args.include.comments.include?.author) {
              result.comments = result.comments.map((c: any) => ({
                ...c,
                author: users.find(u => u.id === c.authorId) || { id: c.authorId, profile: { username: 'unknown' } }
              }));
            }
          }
          if (args.include.author) {
            result.author = users.find(u => u.id === post.authorId) || { id: post.authorId, profile: { username: 'unknown' } };
          }
          if (args.include.category) {
            result.category = categories.find(c => c.id === post.categoryId) || { id: post.categoryId, name: 'Unknown', slug: 'unknown' };
          }
          if (args.include.bookmarks) {
            result.bookmarks = bookmarks.filter(b => b.postId === post.id);
          }
          return Promise.resolve(result);
        }
        return Promise.resolve(post);
      }),
      update: vi.fn().mockImplementation((args: any) => {
        const id = args?.where?.id;
        const p = posts.find(p => p.id === id);
        if (!p) {
          const error = new Error('Record to update not found.');
          (error as any).code = 'P2025';
          return Promise.reject(error);
        }
        let newCommentCount = p.commentCount;
        if (args?.data?.commentCount?.increment) {
          newCommentCount = (p.commentCount || 0) + args.data.commentCount.increment;
        } else if (typeof args?.data?.commentCount === 'number') {
          newCommentCount = args.data.commentCount;
        }

        let newVoteScore = p.voteScore;
        if (args?.data?.voteScore?.increment) {
          newVoteScore = (p.voteScore || 0) + args.data.voteScore.increment;
        } else if (typeof args?.data?.voteScore === 'number') {
          newVoteScore = args.data.voteScore;
        }

        Object.assign(p, args.data || {});
        p.commentCount = newCommentCount;
        p.voteScore = newVoteScore;
        p.updatedAt = new Date();
        return Promise.resolve(p);
      }),
      delete: vi.fn().mockResolvedValue({ id: 'p1' }),
      deleteMany: vi.fn().mockImplementation(() => {
        posts.length = 0;
        return Promise.resolve({ count: 1 });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args?.where?.id || 'p1', ...args?.create })),
    },
    comment: {
      create: vi.fn().mockImplementation((args: any) => {
        const c = {
          id: `com_${comments.length + 1}`,
          ...args?.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          voteScore: 0,
          author: users.find(u => u.id === (args?.data?.authorId)) || { id: args?.data?.authorId, profile: { username: 'tester' } }
        };
        comments.push(c);
        return Promise.resolve(c);
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = comments.filter(c => !args?.where?.postId || c.postId === args.where.postId);
        return Promise.resolve(list);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const c = comments.find(c => {
          if (args?.where?.id && c.id !== args.where.id) return false;
          if (args?.where?.postId && c.postId !== args.where.postId) return false;
          if (args?.where?.authorId && c.authorId !== args.where.authorId) return false;
          if (args?.where?.parentCommentId !== undefined && c.parentCommentId !== args.where.parentCommentId) return false;
          return true;
        });
        return Promise.resolve(c || null);
      }),
      count: vi.fn().mockImplementation((args: any) => {
        const list = comments.filter(c => {
          if (args?.where?.postId && c.postId !== args.where.postId) return false;
          if (args?.where?.authorId && c.authorId !== args.where.authorId) return false;
          return true;
        });
        return Promise.resolve(list.length);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const c = comments.find(c => c.id === args?.where?.id);
        return Promise.resolve(c || null);
      }),
      update: vi.fn().mockImplementation((args: any) => {
        const c = comments.find(c => c.id === args?.where?.id);
        if (c) {
          let newVoteScore = c.voteScore;
          if (args?.data?.voteScore?.increment) {
            newVoteScore = (c.voteScore || 0) + args.data.voteScore.increment;
          } else if (typeof args?.data?.voteScore === 'number') {
            newVoteScore = args.data.voteScore;
          }
          Object.assign(c, args.data || {});
          c.voteScore = newVoteScore;
        }
        return Promise.resolve(c || { id: args?.where?.id, ...args?.data });
      }),
      delete: vi.fn().mockImplementation((args: any) => {
        const index = comments.findIndex(c => c.id === args?.where?.id);
        if (index !== -1) comments.splice(index, 1);
        return Promise.resolve({ id: args?.where?.id });
      }),
      deleteMany: vi.fn().mockImplementation(() => {
        comments.length = 0;
        return Promise.resolve({ count: 1 });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args?.where?.id || 'com1', ...args?.create })),
    },
    report: {
      create: vi.fn().mockImplementation((args: any) => {
        const r = { id: `rep_${reports.length + 1}`, ...args.data, createdAt: new Date() };
        reports.push(r);
        return Promise.resolve(r);
      }),
      createMany: vi.fn().mockImplementation((args: any) => {
        if (args?.data) {
          args.data.forEach((d: any) => reports.push({ id: `rep_${reports.length + 1}`, ...d, createdAt: new Date() }));
        }
        return Promise.resolve({ count: args?.data?.length || 0 });
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = reports;
        if (args?.where?.status) list = list.filter(r => r.status === args.where.status);
        if (args?.where?.reporterId) list = list.filter(r => r.reporterId === args.where.reporterId);
        return Promise.resolve(list);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const r = reports.find(r => {
          if (args?.where?.reporterId && r.reporterId !== args.where.reporterId) return false;
          if (args?.where?.targetType && r.targetType !== args.where.targetType) return false;
          if (args?.where?.targetId && r.targetId !== args.where.targetId) return false;
          if (args?.where?.status?.in && !args.where.status.in.includes(r.status)) return false;
          if (args?.where?.status && typeof args.where.status === 'string' && r.status !== args.where.status) return false;
          return true;
        });
        return Promise.resolve(r || null);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => Promise.resolve(reports.find(r => r.id === args.where.id) || null)),
      count: vi.fn().mockImplementation((args: any) => {
        let list = reports;
        if (args?.where?.status) list = list.filter(r => r.status === args.where.status);
        return Promise.resolve(list.length);
      }),
      update: vi.fn().mockImplementation((args: any) => {
        const r = reports.find(r => r.id === args.where.id);
        if (r) Object.assign(r, args.data);
        return Promise.resolve(r || { id: args.where.id, ...args.data });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      delete: vi.fn().mockResolvedValue({ id: 'rep1' }),
      deleteMany: vi.fn().mockImplementation(() => { reports.length = 0; return Promise.resolve({ count: 1 }); }),
    },
    bookmark: {
      findUnique: vi.fn().mockImplementation((args: any) => {
        const b = bookmarks.find(bm => (bm.id === args.where.id) || (bm.userId === args.where.userId_postId?.userId && bm.postId === args.where.userId_postId?.postId));
        if (!b) return Promise.resolve(null);
        const post = posts.find(p => p.id === b.postId);
        return Promise.resolve({ ...b, post });
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const b = bookmarks.find(bm => bm.userId === args.where?.userId && bm.postId === args.where?.postId);
        if (!b) return Promise.resolve(null);
        const post = posts.find(p => p.id === b.postId);
        return Promise.resolve({ ...b, post });
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const b = { id: `bm_${bookmarks.length + 1}`, ...args.data, createdAt: new Date() };
        bookmarks.push(b);
        return Promise.resolve(b);
      }),
      createMany: vi.fn().mockImplementation((args: any) => {
        args.data.forEach((d: any) => bookmarks.push({ id: `bm_${bookmarks.length + 1}`, ...d, createdAt: new Date() }));
        return Promise.resolve({ count: args.data.length });
      }),
      delete: vi.fn().mockImplementation((args: any) => {
        const index = bookmarks.findIndex(bm => bm.id === args.where.id || (bm.userId === args.where.userId_postId?.userId && bm.postId === args.where.userId_postId?.postId));
        if (index !== -1) bookmarks.splice(index, 1);
        return Promise.resolve({ id: 'bm1' });
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = bookmarks.filter(bm => !args.where?.userId || bm.userId === args.where.userId);
        const joined = list.map(b => ({
          ...b,
          post: posts.find(p => p.id === b.postId) || { id: b.postId, title: 'Post', content: 'Content', createdAt: new Date() }
        }));
        return Promise.resolve(joined);
      }),
      count: vi.fn().mockImplementation((args: any) => {
        const list = bookmarks.filter(bm => !args.where?.userId || bm.userId === args.where.userId);
        return Promise.resolve(list.length);
      }),
    },
    resource: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = resources.filter(r => {
          if (args?.where?.status && r.status !== args.where.status) return false;
          if (args?.where?.category && r.category !== args.where.category) return false;
          return true;
        });
        if (args?.orderBy?.views === 'desc') {
          list.sort((a, b) => (b.views || 0) - (a.views || 0));
        }
        if (args?.take) list = list.slice(0, args.take);
        return Promise.resolve(list);
      }),
      createMany: vi.fn().mockImplementation((args: any) => {
        if (args?.data) {
          args.data.forEach((d: any) => resources.push({ id: `res_${resources.length + 1}`, ...d, createdAt: new Date() }));
        }
        return Promise.resolve({ count: args?.data?.length || 0 });
      }),
      deleteMany: vi.fn().mockImplementation(() => {
        resources.length = 0;
        return Promise.resolve({ count: 1 });
      }),
      findUnique: vi.fn().mockImplementation((args: any) => Promise.resolve(resources.find(r => r.id === args.where.id) || null)),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
    },
    emailVerificationToken: {
      create: vi.fn().mockImplementation((args: any) => {
        const token = {
          id: `ev_${verificationTokens.length + 1}`,
          ...args.data,
          createdAt: new Date(),
        };
        verificationTokens.push(token);
        return Promise.resolve(token);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const token = verificationTokens.find(t => t.tokenHash === args.where.tokenHash || t.id === args.where.id);
        if (!token) return Promise.resolve(null);
        return Promise.resolve({ ...token, user: { id: token.userId, email: 'test@example.com' } });
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const token = verificationTokens.find(t => t.userId === args.where?.userId);
        return Promise.resolve(token || null);
      }),
      delete: vi.fn().mockImplementation((args: any) => {
        const index = verificationTokens.findIndex(t => t.id === args.where.id || t.tokenHash === args.where.tokenHash);
        if (index !== -1) verificationTokens.splice(index, 1);
        return Promise.resolve({ id: 'ev1' });
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    passwordResetToken: {
      create: vi.fn().mockImplementation((args: any) => {
        const token = {
          id: `pr_${tokens.length + 1}`,
          ...args.data,
          createdAt: new Date(),
        };
        tokens.push(token);
        return Promise.resolve(token);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const token = tokens.find(t => t.tokenHash === args.where.tokenHash || t.id === args.where.id);
        if (!token) return Promise.resolve(null);
        return Promise.resolve({ ...token, user: { id: token.userId, email: 'test@example.com' } });
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const token = tokens.find(t => t.userId === args.where?.userId);
        return Promise.resolve(token || null);
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockImplementation((args: any) => {
        const token = tokens.find(t => t.id === args.where.id);
        if (token) Object.assign(token, args.data);
        return Promise.resolve(token || { id: args.where.id, ...args.data });
      }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit1' }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    moderationAction: {
      create: vi.fn().mockImplementation((args: any) => {
        const ma = { id: `ma_${moderationActions.length + 1}`, ...args.data, createdAt: new Date() };
        moderationActions.push(ma);
        return Promise.resolve(ma);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const ma = moderationActions.find(ma => ma.postId === args.where?.postId && ma.action === args.where?.action);
        return Promise.resolve(ma || null);
      }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(moderationActions)),
      deleteMany: vi.fn().mockImplementation(() => { moderationActions.length = 0; return Promise.resolve({ count: 1 }); }),
    },
    modActionLog: {
      create: vi.fn().mockImplementation((args: any) => {
        const mal = { id: `mal_${modActionLogs.length + 1}`, ...args.data, createdAt: new Date() };
        modActionLogs.push(mal);
        return Promise.resolve(mal);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        const mal = modActionLogs.find(mal => mal.targetId === args.where?.targetId && mal.actionType === args.where?.actionType);
        return Promise.resolve(mal || null);
      }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(modActionLogs)),
      deleteMany: vi.fn().mockImplementation(() => { modActionLogs.length = 0; return Promise.resolve({ count: 1 }); }),
    },
    directMessage: {
      create: vi.fn().mockResolvedValue({ id: 'dm1' }),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    aIConversation: {
      create: vi.fn().mockImplementation((args: any) => {
        const conv = { id: `conv_${aiConversations.length + 1}`, ...args.data, createdAt: new Date() };
        aiConversations.push(conv);
        return Promise.resolve(conv);
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        const list = aiConversations.filter(c => !args?.where?.userId || c.userId === args.where.userId);
        return Promise.resolve(list);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => Promise.resolve(aiConversations.find(c => c.id === args.where.id) || null)),
      deleteMany: vi.fn().mockImplementation(() => { aiConversations.length = 0; return Promise.resolve({ count: 1 }); }),
    },
    aIMessage: {
      create: vi.fn().mockImplementation((args: any) => {
        const msg = { id: `msg_${aiMessages.length + 1}`, ...args.data, createdAt: new Date() };
        aiMessages.push(msg);
        return Promise.resolve(msg);
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        const list = aiMessages.filter(m => !args?.where?.conversationId || m.conversationId === args.where.conversationId);
        return Promise.resolve(list);
      }),
      deleteMany: vi.fn().mockImplementation(() => { aiMessages.length = 0; return Promise.resolve({ count: 1 }); }),
    },
    aIJob: {
      create: vi.fn().mockImplementation((args: any) => {
        const job = {
          id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          ...args.data,
          status: "pending",
          retryCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return Promise.resolve(job);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        return Promise.resolve(null);
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
    },
    dailyWin: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = dailyWins.filter(d => !args?.where?.userId || d.userId === args.where.userId);
        if (args?.orderBy?.date === 'desc') {
          list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        if (args?.take) list = list.slice(0, args.take);
        if (args?.skip) list = list.slice(args.skip);
        return Promise.resolve(list);
      }),
      count: vi.fn().mockImplementation((args: any) => {
        const list = dailyWins.filter(d => !args?.where?.userId || d.userId === args.where.userId);
        return Promise.resolve(list.length);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const w = { id: `dw_${dailyWins.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
        dailyWins.push(w);
        return Promise.resolve(w);
      }),
    },
    therapySession: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = therapySessions.filter(s => !args?.where?.userId || s.userId === args.where.userId);
        if (args?.where?.childName) list = list.filter(s => s.childName === args.where.childName);
        if (args?.where?.therapyType) list = list.filter(s => s.therapyType === args.where.therapyType);
        if (args?.orderBy?.sessionDate === 'desc') {
          list = [...list].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
        }
        if (args?.take) list = list.slice(0, args.take);
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const s = {
          id: `ts_${therapySessions.length + 1}`,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        therapySessions.push(s);
        return Promise.resolve(s);
      }),
    },
    emergencyCard: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = emergencyCards.filter(c => !args?.where?.userId || c.userId === args.where.userId);
        if (args?.orderBy?.createdAt === 'desc') {
          list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const c = { id: `ec_${emergencyCards.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
        emergencyCards.push(c);
        return Promise.resolve(c);
      }),
    },
    savedRhyme: {
      findUnique: vi.fn().mockImplementation((args: any) => {
        const where = args.where?.userId_rhymeId || args.where;
        const r = savedRhymes.find(s => s.userId === where.userId && s.rhymeId === where.rhymeId);
        return Promise.resolve(r || null);
      }),
      findMany: vi.fn().mockImplementation((args: any) => {
        const list = savedRhymes.filter(s => !args?.where?.userId || s.userId === args.where.userId);
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const r = { id: `sr_${savedRhymes.length + 1}`, ...args.data, createdAt: new Date() };
        savedRhymes.push(r);
        return Promise.resolve(r);
      }),
      delete: vi.fn().mockImplementation((args: any) => {
        const idx = savedRhymes.findIndex(s => s.id === args.where.id);
        if (idx !== -1) savedRhymes.splice(idx, 1);
        return Promise.resolve({ id: args.where.id });
      }),
    },
    provider: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = [...providers];
        if (args?.where) {
          if (args.where.city) list = list.filter(p => p.city === args.where.city);
          if (args.where.state) list = list.filter(p => p.state === args.where.state);
          if (args.where.isVerified !== undefined) list = list.filter(p => p.isVerified === args.where.isVerified);
          if (args.where.specialties?.has) {
            list = list.filter(p => p.specialties?.includes(args.where.specialties.has));
          }
        }
        if (args?.orderBy) {
          if (args.orderBy.rating === 'desc') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          else if (args.orderBy.name === 'asc') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        if (args?.take) list = list.slice(0, args.take);
        return Promise.resolve(list);
      }),
      createMany: vi.fn().mockImplementation((args: any) => {
        if (args?.data) {
          args.data.forEach((d: any) => providers.push({ id: `prov_${providers.length + 1}`, ...d, createdAt: new Date() }));
        }
        return Promise.resolve({ count: args?.data?.length || 0 });
      }),
      deleteMany: vi.fn().mockImplementation(() => {
        providers.length = 0;
        return Promise.resolve({ count: 1 });
      }),
    },
    userFinder: {
      upsert: vi.fn().mockImplementation((args: any) => {
        const existingIndex = userFinders.findIndex((uf: any) => uf.userId === args.where.userId);
        const data = existingIndex >= 0 ? args.update : args.create;
        const uf = { id: existingIndex >= 0 ? userFinders[existingIndex].id : `uf_${userFinders.length + 1}`, ...data };
        if (existingIndex >= 0) {
          userFinders[existingIndex] = uf;
        } else {
          userFinders.push(uf);
        }
        return Promise.resolve(uf);
      }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(userFinders)),
      findUnique: vi.fn().mockImplementation((args: any) => Promise.resolve(userFinders.find((uf: any) => uf.userId === args.where.userId) || null)),
      deleteMany: vi.fn().mockImplementation(() => { userFinders.length = 0; return Promise.resolve({ count: 1 }); }),
    },
    vote: {
      findMany: vi.fn().mockImplementation((args: any) => {
        let list = votes;
        if (args?.where?.targetId) list = list.filter(v => v.targetId === args.where.targetId);
        if (args?.where?.targetType) list = list.filter(v => v.targetType === args.where.targetType);
        return Promise.resolve(list);
      }),
      findFirst: vi.fn().mockImplementation((args: any) => {
        let list = votes;
        if (args?.where?.targetId) list = list.filter(v => v.targetId === args.where.targetId);
        if (args?.where?.targetType) list = list.filter(v => v.targetType === args.where.targetType);
        return Promise.resolve(list[0] || null);
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const v = { id: `v_${votes.length + 1}`, ...args.data };
        votes.push(v);
        return Promise.resolve(v);
      }),
      delete: vi.fn().mockImplementation((args: any) => {
        const where = args.where?.userId_targetId_targetType || args.where;
        const index = votes.findIndex(v =>
          (v.id === args.where.id) ||
          (v.userId === where.userId && v.targetId === where.targetId && v.targetType === where.targetType)
        );
        if (index !== -1) votes.splice(index, 1);
        return Promise.resolve({ id: 'v1' });
      }),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const where = args.where?.userId_targetId_targetType || args.where;
        const v = votes.find(v =>
          (v.id === args.where.id) ||
          (v.userId === where.userId && v.targetId === where.targetId && v.targetType === where.targetType)
        );
        return Promise.resolve(v || null);
      }),
      upsert: vi.fn().mockImplementation((args: any) => {
        const where = args.where?.userId_targetId_targetType || args.where;
        let v = votes.find(v =>
          (v.userId === where.userId && v.targetId === where.targetId && v.targetType === where.targetType)
        );
        if (v) {
          Object.assign(v, args.update || {});
        } else {
          v = { id: `v_${votes.length + 1}`, ...args.create };
          votes.push(v);
        }
        return Promise.resolve(v);
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockImplementation((args: any) => {
        const v = votes.find(v => v.id === args.where.id);
        if (v) Object.assign(v, args.data);
        return Promise.resolve(v || { id: 'v1', ...args.data });
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    $transaction: vi.fn().mockImplementation((cb) =>
      Array.isArray(cb) ? Promise.all(cb) :
        typeof cb === 'function' ? cb(prismaMock) :
          Promise.resolve(cb)
    ),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $connect: vi.fn().mockResolvedValue(undefined),
  };

  return {
    mockTokens: tokens,
    mockVerificationTokens: verificationTokens,
    mockUsers: users,
    mockBookmarks: bookmarks,
    mockPosts: posts,
    mockComments: comments,
    mockVotes: votes,
    mockTags: tags,
    mockResources: resources,
    mockCategories: categories,
    mockUserRoles: userRoles,
    mockReports: reports,
    mockModerationActions: moderationActions,
    mockModActionLogs: modActionLogs,
    mockAIConversations: aiConversations,
    mockAIMessages: aiMessages,
    mockProviders: providers,
    mockUserFinders: userFinders,
    mockDailyWins: dailyWins,
    mockTherapySessions: therapySessions,
    mockEmergencyCards: emergencyCards,
    mockSavedRhymes: savedRhymes,
    mockPrisma: prismaMock
  };
});

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: class { constructor() { return mockPrisma; } },
  Role: { PARENT: 'PARENT', THERAPIST: 'THERAPIST', MODERATOR: 'MODERATOR', ADMIN: 'ADMIN' },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error { code = ''; meta = {}; constructor(m: string, c: string) { super(m); this.code = c; } },
    PrismaClientValidationError: class extends Error { },
    validator: () => (v: any) => v,
    DbNull: 'DbNull', JsonNull: 'JsonNull', AnyNull: 'AnyNull',
  }
}));

// Mock internal prisma instance
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

// Mock Redis
vi.mock('@/lib/redis', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
  CACHE_TTL: { POSTS_FEED: 3600, POST_DETAILS: 3600, TAGS: 3600, CATEGORIES: 3600 },
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  cacheKey: vi.fn().mockReturnValue('cache-key'),
  checkDuplicateReport: vi.fn().mockResolvedValue(false),
  blockDuplicateReport: vi.fn().mockResolvedValue(undefined),
}));

// Mock Logger - Print errors to console for easier debugging
vi.mock('@/lib/logger', () => {
  const log = (level: string, ...args: any[]) => {
    if (level === 'ERROR') console.error(`[LOGGER ${level}]`, ...args);
    // Silencing other levels to avoid clutter, but can be enabled if needed
  };
  const mockLogger = {
    debug: vi.fn().mockImplementation((...args) => log('DEBUG', ...args)),
    info: vi.fn().mockImplementation((...args) => log('INFO', ...args)),
    warn: vi.fn().mockImplementation((...args) => log('WARN', ...args)),
    error: vi.fn().mockImplementation((...args) => log('ERROR', ...args)),
    child: vi.fn().mockReturnThis(),
  };
  return {
    logger: mockLogger,
    createLogger: vi.fn().mockReturnValue(mockLogger),
    logLevels: { debug: 'debug', info: 'info', warn: 'warn', error: 'error' },
  };
});

// Mock Rate Limiter
vi.mock('@/lib/rateLimit', () => {
  const limiter = {
    checkLimit: vi.fn().mockResolvedValue(true),
    getRemaining: vi.fn().mockResolvedValue(10),
    getRetryAfter: vi.fn().mockResolvedValue(0),
  };
  return {
    RATE_LIMITERS: new Proxy({}, { get: () => limiter }),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
    rateLimitResponse: vi.fn().mockImplementation((retry) => {
      return new Response(JSON.stringify({ error: 'Rate limit', retryAfter: retry }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }),
  };
});

// Export a helper function for test cleanup
export const resetMockData = () => {
  mockTokens.length = 0;
  mockVerificationTokens.length = 0;
  mockUsers.length = 0;
  mockUserRoles.length = 0;
  mockBookmarks.length = 0;
  mockPosts.length = 0;
  mockComments.length = 0;
  mockVotes.length = 0;
  mockResources.length = 0;
  mockCategories.length = 0;
  mockTags.length = 0;
  mockReports.length = 0;
  mockModerationActions.length = 0;
  mockModActionLogs.length = 0;
  mockAIConversations.length = 0;
  mockAIMessages.length = 0;
  mockProviders.length = 0;
  mockUserFinders.length = 0;
  mockDailyWins.length = 0;
  mockTherapySessions.length = 0;
  mockEmergencyCards.length = 0;
  mockSavedRhymes.length = 0;

  // Repopulate default data
  mockCategories.push(
    { id: 'c1', name: 'General Discussion', slug: 'general-discussion', description: 'General topics', order: 1, _count: { posts: 0 } },
    { id: 'c2', name: 'Diagnosis & Assessment', slug: 'diagnosis', description: 'Diagnosis questions', order: 2, _count: { posts: 0 } },
    { id: 'c3', name: 'Therapies & Treatments', slug: 'therapies', description: 'Treatment options', order: 3, _count: { posts: 0 } },
    { id: 'c4', name: 'Education & School', slug: 'education', description: 'School support', order: 4, _count: { posts: 0 } }
  );

  mockTags.push(
    { id: 't1', name: 'Autism', slug: 'autism', _count: { posts: 10 } },
    { id: 't2', name: 'ADHD', slug: 'adhd', _count: { posts: 5 } },
    { id: 't3', name: 'Dyslexia', slug: 'dyslexia', _count: { posts: 2 } },
    { id: 't4', name: 'Anxiety', slug: 'anxiety', _count: { posts: 8 } }
  );
};

// Initialize default data once on module load
resetMockData();

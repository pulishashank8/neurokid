/**
 * Prisma Seed Script for NeuroKid
 * 
 * This script initializes the database with seed data for development and testing.
 * It creates:
 * - Admin and moderator users
 * - Default categories and tags
 * - Sample resources
 */

const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'src', 'generated', 'prisma'));
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NeuroKid database seed...');

  try {
    // ============================================================================
    // CREATE CATEGORIES
    // ============================================================================
    console.log('📁 Creating categories...');
    
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'behavior' },
        update: {},
        create: {
          name: 'Behavior',
          slug: 'behavior',
          description: 'Discussions about behavioral challenges and strategies',
          icon: '🎯',
          order: 1,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'speech' },
        update: {},
        create: {
          name: 'Speech & Language',
          slug: 'speech',
          description: 'Speech therapy and language development',
          icon: '💬',
          order: 2,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'school' },
        update: {},
        create: {
          name: 'School & Education',
          slug: 'school',
          description: 'School transitions, IEPs, and educational support',
          icon: '🎓',
          order: 3,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'therapy' },
        update: {},
        create: {
          name: 'Therapy & Treatment',
          slug: 'therapy',
          description: 'OT, PT, ABA and other therapeutic interventions',
          icon: '🏥',
          order: 4,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'sleep' },
        update: {},
        create: {
          name: 'Sleep Issues',
          slug: 'sleep',
          description: 'Sleep routines, melatonin, and sleep challenges',
          icon: '😴',
          order: 5,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'nutrition' },
        update: {},
        create: {
          name: 'Nutrition & Diet',
          slug: 'nutrition',
          description: 'Picky eating, sensory food issues, and nutrition',
          icon: '🍎',
          order: 6,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'iep' },
        update: {},
        create: {
          name: 'IEP & 504 Plans',
          slug: 'iep',
          description: 'Individualized Education Plans and accommodations',
          icon: '📋',
          order: 7,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'general' },
        update: {},
        create: {
          name: 'General Discussion',
          slug: 'general',
          description: 'General topics and announcements',
          icon: '💭',
          order: 8,
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // ============================================================================
    // CREATE TAGS
    // ============================================================================
    console.log('🏷️  Creating tags...');
    
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'sensory' },
        update: {},
        create: { name: 'Sensory', slug: 'sensory', color: '#FF6B6B' },
      }),
      prisma.tag.upsert({
        where: { slug: 'meltdown' },
        update: {},
        create: { name: 'Meltdown', slug: 'meltdown', color: '#FF8C00' },
      }),
      prisma.tag.upsert({
        where: { slug: 'social-skills' },
        update: {},
        create: { name: 'Social Skills', slug: 'social-skills', color: '#4ECDC4' },
      }),
      prisma.tag.upsert({
        where: { slug: 'anxiety' },
        update: {},
        create: { name: 'Anxiety', slug: 'anxiety', color: '#95E1D3' },
      }),
      prisma.tag.upsert({
        where: { slug: 'medication' },
        update: {},
        create: { name: 'Medication', slug: 'medication', color: '#FFA07A' },
      }),
      prisma.tag.upsert({
        where: { slug: 'aba' },
        update: {},
        create: { name: 'ABA', slug: 'aba', color: '#98D8C8' },
      }),
      prisma.tag.upsert({
        where: { slug: 'communication' },
        update: {},
        create: { name: 'Communication', slug: 'communication', color: '#6C5CE7' },
      }),
      prisma.tag.upsert({
        where: { slug: 'transition' },
        update: {},
        create: { name: 'Transition', slug: 'transition', color: '#74B9FF' },
      }),
    ]);

    console.log(`✅ Created ${tags.length} tags`);

    // ============================================================================
    // CREATE ADMIN USER
    // ============================================================================
    console.log('👤 Creating admin user...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@neurokid.local' },
      update: {},
      create: {
        email: 'admin@neurokid.local',
        hashedPassword: adminPassword,
        profile: {
          create: {
            username: 'admin',
            displayName: 'Admin User',
            bio: 'NeuroKid Administrator',
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
            verifiedTherapist: false,
            notificationPrefs: {
              emailNotifications: true,
              postComments: true,
              postLikes: true,
              mentions: true,
            },
          },
        },
        userRoles: {
          create: [
            { role: 'ADMIN' },
            { role: 'MODERATOR' },
          ],
        },
      },
      include: { profile: true },
    });

    console.log(`✅ Created admin user: ${adminUser.email}`);

    // ============================================================================
    // CREATE MODERATOR USER
    // ============================================================================
    console.log('🛡️  Creating moderator user...');

    const modPassword = await bcrypt.hash('moderator123', 10);

    const modUser = await prisma.user.upsert({
      where: { email: 'moderator@neurokid.local' },
      update: {},
      create: {
        email: 'moderator@neurokid.local',
        hashedPassword: modPassword,
        profile: {
          create: {
            username: 'moderator',
            displayName: 'Moderator',
            bio: 'Community Moderator',
            avatarUrl: 'https://ui-avatars.com/api/?name=Moderator&background=1ABC9C&color=fff',
            verifiedTherapist: false,
            notificationPrefs: {
              emailNotifications: true,
              postComments: true,
              mentions: true,
            },
          },
        },
        userRoles: {
          create: [
            { role: 'MODERATOR' },
          ],
        },
      },
      include: { profile: true },
    });

    console.log(`✅ Created moderator user: ${modUser.email}`);

    // ============================================================================
    // CREATE SAMPLE PARENT USER
    // ============================================================================
    console.log('👨‍👩‍👧‍👦 Creating sample parent user...');

    const parentPassword = await bcrypt.hash('parent123', 10);

    const parentUser = await prisma.user.upsert({
      where: { email: 'parent@neurokid.local' },
      update: {},
      create: {
        email: 'parent@neurokid.local',
        hashedPassword: parentPassword,
        profile: {
          create: {
            username: 'sarah_parent',
            displayName: 'Sarah',
            bio: 'Parent of two amazing autistic kids 💙',
            location: 'Portland, OR',
            avatarUrl: 'https://ui-avatars.com/api/?name=Sarah&background=E74C3C&color=fff',
            verifiedTherapist: false,
            notificationPrefs: {
              emailNotifications: true,
              postComments: true,
              postLikes: false,
              mentions: true,
            },
          },
        },
        userRoles: {
          create: [
            { role: 'PARENT' },
          ],
        },
      },
      include: { profile: true },
    });

    console.log(`✅ Created parent user: ${parentUser.email}`);

    // ============================================================================
    // CREATE SAMPLE THERAPIST USER
    // ============================================================================
    console.log('💼 Creating sample therapist user...');

    const therapistPassword = await bcrypt.hash('therapist123', 10);

    const therapistUser = await prisma.user.upsert({
      where: { email: 'therapist@neurokid.local' },
      update: {},
      create: {
        email: 'therapist@neurokid.local',
        hashedPassword: therapistPassword,
        profile: {
          create: {
            username: 'dr_smith_slp',
            displayName: 'Dr. Emily Smith',
            bio: 'Licensed Speech-Language Pathologist | 10+ years experience | Autism specialist',
            location: 'Seattle, WA',
            website: 'https://example.com',
            avatarUrl: 'https://ui-avatars.com/api/?name=Emily+Smith&background=27AE60&color=fff',
            verifiedTherapist: true,
            verifiedAt: new Date(),
            notificationPrefs: {
              emailNotifications: true,
              postComments: true,
              mentions: true,
            },
          },
        },
        userRoles: {
          create: [
            { role: 'THERAPIST' },
          ],
        },
      },
      include: { profile: true },
    });

    console.log(`✅ Created therapist user: ${therapistUser.email}`);

    // ============================================================================
    // CREATE SAMPLE RESOURCES
    // ============================================================================
    console.log('📚 Creating sample resources...');

    const resources = await Promise.all([
      prisma.resource.create({
        data: {
          title: 'Understanding Autism Meltdowns vs Tantrums',
          content: 'A comprehensive guide to understanding the difference between autistic meltdowns and typical tantrums, with strategies for parents.',
          link: 'https://example.com/resources/meltdowns',
          category: 'BEHAVIOR',
          createdBy: adminUser.id,
          status: 'ACTIVE',
        },
      }),
      prisma.resource.create({
        data: {
          title: 'Sensory Strategies for At-Home Learning',
          content: 'Practical sensory accommodation strategies to help autistic children focus during remote learning.',
          link: 'https://example.com/resources/sensory',
          category: 'EDUCATION',
          createdBy: therapistUser.id,
          status: 'ACTIVE',
        },
      }),
      prisma.resource.create({
        data: {
          title: 'Nutrition Guide for Selective Eaters',
          content: 'Evidence-based approaches to expanding food preferences in autistic children with sensory food aversions.',
          link: 'https://example.com/resources/nutrition',
          category: 'NUTRITION',
          createdBy: adminUser.id,
          status: 'ACTIVE',
        },
      }),
      prisma.resource.create({
        data: {
          title: 'IEP Meeting Preparation Checklist',
          content: 'Step-by-step checklist to prepare for your child\'s IEP meeting and advocate effectively.',
          link: 'https://example.com/resources/iep',
          category: 'LEGAL',
          createdBy: adminUser.id,
          status: 'ACTIVE',
        },
      }),
    ]);

    console.log(`✅ Created ${resources.length} resources`);

    // ============================================================================
    // CREATE SAMPLE POST
    // ============================================================================
    console.log('📝 Creating sample post...');

    const samplePost = await prisma.post.create({
      data: {
        title: 'Tips for Managing Transitions at Home',
        content: `I've found that visual schedules have been a game changer for our family! Here are some strategies that work for us:

1. **Visual schedules** - Use pictures or written steps for daily routines
2. **Transition warnings** - Give advance notice (5 min, 2 min, 1 min)
3. **Special interests** - Use favorite activities as motivation
4. **Sensory breaks** - Build in time for movement or quiet time

What strategies have worked for your family? Would love to hear what you've tried!`,
        authorId: parentUser.id,
        isAnonymous: false,
        categoryId: categories[2].id, // School & Education
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
      },
    });

    // Connect tags to post
    await prisma.post.update({
      where: { id: samplePost.id },
      data: {
        tags: {
          connect: [
            { id: tags[7].id }, // Transition
            { id: tags[0].id }, // Sensory
          ],
        },
      },
    });

    console.log(`✅ Created sample post: "${samplePost.title}"`);

    // ============================================================================
    // CREATE SAMPLE COMMENTS
    // ============================================================================
    console.log('💬 Creating sample comments...');

    const comment1 = await prisma.comment.create({
      data: {
        content: `Great tips! We also use a sand timer so our son can visually see how much time he has. Combined with your visual schedule, it's been really helpful.`,
        authorId: therapistUser.id,
        postId: samplePost.id,
        status: 'ACTIVE',
      },
    });

    const comment2 = await prisma.comment.create({
      data: {
        content: `Thanks for sharing! We struggle with the 2-minute warning. Do you find it works better verbally or visually (like on a timer)?`,
        authorId: modUser.id,
        postId: samplePost.id,
        status: 'ACTIVE',
      },
    });

    console.log(`✅ Created 2 sample comments`);

    // ============================================================================
    // CREATE SAMPLE VOTES
    // ============================================================================
    console.log('👍 Creating sample votes...');

    await prisma.vote.createMany({
      data: [
        {
          userId: therapistUser.id,
          targetType: 'POST',
          targetId: samplePost.id,
          value: 1,
        },
        {
          userId: modUser.id,
          targetType: 'POST',
          targetId: samplePost.id,
          value: 1,
        },
        {
          userId: parentUser.id,
          targetType: 'COMMENT',
          targetId: comment1.id,
          value: 1,
        },
      ],
    });

    console.log(`✅ Created sample votes`);

    // ============================================================================
    // CREATE SAMPLE BOOKMARK
    // ============================================================================
    console.log('🔖 Creating sample bookmark...');

    await prisma.bookmark.create({
      data: {
        userId: parentUser.id,
        postId: samplePost.id,
      },
    });

    console.log(`✅ Created sample bookmark`);

    console.log('\n✨ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${categories.length} categories created`);
    console.log(`   - ${tags.length} tags created`);
    console.log('   - 1 admin user created');
    console.log('   - 1 moderator user created');
    console.log('   - 1 parent user created');
    console.log('   - 1 therapist user created');
    console.log(`   - ${resources.length} resources created`);
    console.log('   - 1 sample post created');
    console.log('   - 2 sample comments created');
    console.log('   - 3 sample votes created');
    console.log('   - 1 sample bookmark created');
    console.log('\n💡 Test login credentials:');
    console.log('   Admin: admin@neurokid.local / admin123');
    console.log('   Moderator: moderator@neurokid.local / moderator123');
    console.log('   Parent: parent@neurokid.local / parent123');
    console.log('   Therapist: therapist@neurokid.local / therapist123');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

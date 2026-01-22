/**
 * Prisma Seed Script for NeuroKind
 * 
 * This script initializes the database with seed data for development and testing.
 * It creates:
 * - Admin and moderator users
 * - Default categories and tags
 * - Sample resources
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NeuroKind database seed...');

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
      where: { email: 'admin@neurokind.local' },
      update: {},
      create: {
        email: 'admin@neurokind.local',
        hashedPassword: adminPassword,
        profile: {
          create: {
            username: 'admin',
            displayName: 'Admin User',
            bio: 'NeuroKind Administrator',
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
      where: { email: 'moderator@neurokind.local' },
      update: {},
      create: {
        email: 'moderator@neurokind.local',
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
      where: { email: 'parent@neurokind.local' },
      update: {},
      create: {
        email: 'parent@neurokind.local',
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
      where: { email: 'therapist@neurokind.local' },
      update: {},
      create: {
        email: 'therapist@neurokind.local',
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

    const resourcesData = [
      // BOOKS
      { title: 'The Reason I Jump by Naoki Higashida', content: 'Written by a 13-year-old autistic boy, this book provides unique insights into the autistic mind and helps parents understand their child\'s perspective.', link: 'https://www.amazon.com/Reason-Jump-Inner-Voice-Thirteen-Year-Old/dp/0812994868', category: 'EDUCATION' },
      { title: 'NeuroTribes by Steve Silberman', content: 'Award-winning book exploring the history of autism and the neurodiversity movement. Essential reading for understanding autism acceptance.', link: 'https://www.amazon.com/NeuroTribes-Legacy-Autism-Future-Neurodiversity/dp/0399185615', category: 'EDUCATION' },
      { title: 'Uniquely Human by Barry M. Prizant', content: 'A compassionate approach to understanding autistic behaviors as coping mechanisms rather than symptoms to eliminate.', link: 'https://www.amazon.com/Uniquely-Human-Different-Way-Seeing/dp/1476776245', category: 'BEHAVIOR' },
      { title: 'The Whole-Brain Child by Daniel J. Siegel', content: 'Brain-based strategies for nurturing your child\'s developing mind, with practical applications for autistic children.', link: 'https://www.amazon.com/Whole-Brain-Child-Revolutionary-Strategies-Developing/dp/0553386697', category: 'EDUCATION' },
      { title: 'Ten Things Every Child with Autism Wishes You Knew', content: 'Insights from an autism advocate and parent on understanding and supporting autistic children.', link: 'https://www.amazon.com/Things-Every-Child-Autism-Wishes/dp/1935274651', category: 'EDUCATION' },
      
      // ORGANIZATIONS & ADVOCACY
      { title: 'Autistic Self Advocacy Network (ASAN)', content: 'Leading organization run by and for autistic people, promoting neurodiversity and self-advocacy. "Nothing About Us Without Us."', link: 'https://autisticadvocacy.org', category: 'COMMUNITY' },
      { title: 'Autism Society of America', content: 'Provides advocacy, resources, and support for the autism community. Local chapters available nationwide.', link: 'https://www.autism-society.org', category: 'COMMUNITY' },
      { title: 'National Autism Association', content: 'Focuses on safety, wandering prevention, and family support services for autism families.', link: 'https://nationalautismassociation.org', category: 'COMMUNITY' },
      { title: 'Autism Speaks Resource Guide', content: 'Comprehensive resource database including toolkits for newly diagnosed families, transition planning, and more.', link: 'https://www.autismspeaks.org/tool-kit', category: 'EDUCATION' },
      { title: 'TACA (The Autism Community in Action)', content: 'Provides education, support, and resources to families affected by autism.', link: 'https://tacanow.org', category: 'COMMUNITY' },
      
      // EDUCATION & IEP RESOURCES
      { title: 'Wrightslaw Special Education Law & Advocacy', content: 'Comprehensive information about special education law, IEPs, and advocacy strategies for parents.', link: 'https://www.wrightslaw.com', category: 'LEGAL' },
      { title: 'Understood.org Learning Disabilities Resource', content: 'Expert-backed resources for learning and thinking differences, including autism and ADHD.', link: 'https://www.understood.org', category: 'EDUCATION' },
      { title: 'IEP Goal Bank', content: 'Database of measurable IEP goals organized by skill area to help parents advocate for appropriate goals.', link: 'https://www.iepgoalbank.com', category: 'LEGAL' },
      { title: 'PACER Center - Champions for Children with Disabilities', content: 'Parent training and information center helping families of children with disabilities.', link: 'https://www.pacer.org', category: 'LEGAL' },
      { title: 'Council of Parent Attorneys and Advocates (COPAA)', content: 'National organization protecting rights of children with disabilities through education and advocacy.', link: 'https://www.copaa.org', category: 'LEGAL' },
      
      // THERAPY & INTERVENTION
      { title: 'How to ABA - Parent Guide', content: 'Free resources teaching parents evidence-based ABA strategies they can use at home.', link: 'https://how-to-aba.com', category: 'THERAPY' },
      { title: 'ASHA - Speech and Language Development', content: 'American Speech-Language-Hearing Association resources for speech and language development.', link: 'https://www.asha.org/public/speech/development', category: 'THERAPY' },
      { title: 'AOTA - Occupational Therapy for Autism', content: 'American Occupational Therapy Association resources for sensory integration and daily living skills.', link: 'https://www.aota.org', category: 'THERAPY' },
      { title: 'Social Thinking Curriculum', content: 'Evidence-based methodology for teaching social competencies to children and adults.', link: 'https://www.socialthinking.com', category: 'SOCIAL_SKILLS' },
      { title: 'TEACCH Autism Program', content: 'Structured teaching approach developed at UNC focusing on visual supports and environmental modifications.', link: 'https://teacch.com', category: 'THERAPY' },
      
      // APPS & TECHNOLOGY
      { title: 'Proloquo2Go AAC App', content: 'Award-winning augmentative communication app with natural-sounding voices and customizable vocabulary.', link: 'https://www.assistiveware.com/products/proloquo2go', category: 'THERAPY' },
      { title: 'ChoiceWorks Visual Schedule App', content: 'Visual schedule and choice board app helping children understand daily routines and make choices.', link: 'https://www.beevisual.com/choiceworks', category: 'BEHAVIOR' },
      { title: 'First Then Visual Schedule', content: 'Simple, effective visual schedule app using pictures to show activity sequences.', link: 'https://www.goodkarmaapplications.com', category: 'BEHAVIOR' },
      { title: 'Touch Chat AAC', content: 'Comprehensive AAC solution with pre-programmed vocabulary sets and customization options.', link: 'https://www.tobiidynavox.com/products/touchchat', category: 'THERAPY' },
      { title: 'Social Stories Creator & Library', content: 'App for creating and accessing social stories to teach social skills and prepare for new situations.', link: 'https://touchautism.com', category: 'SOCIAL_SKILLS' },
      
      // BEHAVIOR & SENSORY
      { title: 'Zones of Regulation', content: 'Curriculum teaching self-regulation through identification of emotions and sensory needs.', link: 'https://www.zonesofregulation.com', category: 'BEHAVIOR' },
      { title: 'The Sensory Processing Disorder Foundation', content: 'Resources for understanding and supporting children with sensory processing challenges.', link: 'https://www.spdfoundation.net', category: 'BEHAVIOR' },
      { title: 'STAR Institute Sensory Resources', content: 'Research-based information on sensory processing and occupational therapy approaches.', link: 'https://www.spdstar.org', category: 'BEHAVIOR' },
      { title: 'Autism Meltdown Guide', content: 'Understanding the difference between meltdowns and tantrums, with de-escalation strategies.', link: 'https://www.autism.org.uk/advice-and-guidance/topics/behaviour/meltdowns', category: 'BEHAVIOR' },
      { title: 'Visual Supports & Schedules Guide', content: 'Comprehensive guide to creating and implementing visual supports at home and school.', link: 'https://afirm.fpg.unc.edu/visual-supports', category: 'BEHAVIOR' },
      
      // NUTRITION & FEEDING
      { title: 'Autism & Food Aversions Research', content: 'Evidence-based strategies for expanding diet in children with sensory food aversions.', link: 'https://www.autismspeaks.org/expert-opinion/feeding-issues-and-children-autism', category: 'NUTRITION' },
      { title: 'SOS Approach to Feeding', content: 'Sequential Oral Sensory feeding program for children with feeding difficulties.', link: 'https://sosapproachtofeeding.com', category: 'NUTRITION' },
      { title: 'Kids Eat Right - Picky Eating Strategies', content: 'Registered dietitian guidance on managing selective eating and nutrition concerns.', link: 'https://www.eatright.org/food/nutrition/eating-as-a-family/picky-eaters', category: 'NUTRITION' },
      { title: 'ARFID Awareness & Resources', content: 'Information on Avoidant/Restrictive Food Intake Disorder common in autistic children.', link: 'https://www.nationaleatingdisorders.org/arfid-avoidant-restrictive-food-intake-disorder', category: 'NUTRITION' },
      
      // SLEEP RESOURCES
      { title: 'Autism Sleep Strategies', content: 'Evidence-based approaches to improving sleep in autistic children, including visual schedules and environmental modifications.', link: 'https://www.autismspeaks.org/expert-opinion/sleep-issues-autism', category: 'SLEEP' },
      { title: 'Sleep Foundation - Autism & Sleep Guide', content: 'Comprehensive guide to understanding and addressing sleep challenges in autism.', link: 'https://www.sleepfoundation.org/children-and-sleep/autism-and-sleep', category: 'SLEEP' },
      { title: 'Melatonin Use in Autism Research', content: 'Research-backed information on melatonin supplementation for sleep issues in autism.', link: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7346127/', category: 'SLEEP' },
      
      // FINANCIAL & INSURANCE
      { title: 'Autism Insurance Coverage State Guide', content: 'State-by-state breakdown of autism insurance mandate laws and coverage requirements.', link: 'https://www.autism-society.org/living-with-autism/autism-through-the-lifespan/autism-insurance/', category: 'FINANCIAL' },
      { title: 'SSI Benefits for Children with Disabilities', content: 'Guide to Supplemental Security Income for children with autism and other disabilities.', link: 'https://www.ssa.gov/benefits/disability/qualify.html', category: 'FINANCIAL' },
      { title: 'ABLE Accounts for Disability Savings', content: 'Tax-advantaged savings accounts for individuals with disabilities without affecting benefits.', link: 'https://www.ablenrc.org', category: 'FINANCIAL' },
      { title: 'Special Needs Trust Guide', content: 'Information on setting up trusts to protect assets for individuals with disabilities.', link: 'https://www.specialneedsalliance.org/the-voice/trusts-2/', category: 'FINANCIAL' },
      
      // SOCIAL SKILLS
      { title: 'Model Me Kids Social Videos', content: 'Video modeling resources teaching social skills through peer demonstration.', link: 'https://modelmekids.com', category: 'SOCIAL_SKILLS' },
      { title: 'Social Stories at Home Guide', content: 'How to create and use Carol Gray\'s Social Stories technique for teaching social concepts.', link: 'https://carolgraysocialstories.com', category: 'SOCIAL_SKILLS' },
      { title: 'Superflex Curriculum', content: 'Fun approach to teaching flexible thinking and social problem-solving.', link: 'https://www.socialthinking.com/products/superflex', category: 'SOCIAL_SKILLS' },
      { title: 'Friendship Development Resources', content: 'Strategies for supporting friendship skills and social connections.', link: 'https://raisingchildren.net.au/autism/development/social-development/friendships-asd', category: 'SOCIAL_SKILLS' },
      
      // TRANSITION & ADULT LIFE
      { title: 'Transition to Adulthood Toolkit', content: 'Comprehensive planning guide for transitioning from school to adult life.', link: 'https://www.autismspeaks.org/tool-kit/transition-tool-kit', category: 'EDUCATION' },
      { title: 'Employment Resources for Autism', content: 'Job search, interview, and workplace accommodation strategies for autistic adults.', link: 'https://www.autism-society.org/living-with-autism/transition-to-adulthood/employment/', category: 'COMMUNITY' },
      { title: 'College Support Services Guide', content: 'Information on disability services and accommodations in higher education.', link: 'https://www.understood.org/en/articles/college-disability-services-what-you-need-to-know', category: 'EDUCATION' },
      
      // SAFETY & WANDERING
      { title: 'Wandering Prevention Resources', content: 'Safety strategies and products to prevent elopement and wandering in autism.', link: 'https://nationalautismassociation.org/resources/autism-safety-facts/', category: 'COMMUNITY' },
      { title: 'Project Lifesaver Tracking Program', content: 'Electronic tracking program for individuals prone to wandering.', link: 'https://projectlifesaver.org', category: 'COMMUNITY' }
    ];

    const resources = await Promise.all(
      resourcesData.map((resource) =>
        prisma.resource.create({
          data: {
            ...resource,
            createdBy: adminUser.id,
            status: 'ACTIVE',
          },
        })
      )
    );

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

    // ============================================================================
    // CREATE DATA CATALOG OWNERS
    // ============================================================================
    console.log('👥 Creating data owners...');

    const dataOwners = await Promise.all([
      prisma.dataOwner.upsert({
        where: { teamName: 'Engineering' },
        update: {},
        create: {
          teamName: 'Engineering',
          contactEmail: 'engineering@neurokind.internal',
          slackChannel: 'eng-data',
        },
      }),
      prisma.dataOwner.upsert({
        where: { teamName: 'Product' },
        update: {},
        create: {
          teamName: 'Product',
          contactEmail: 'product@neurokind.internal',
          slackChannel: 'product',
        },
      }),
      prisma.dataOwner.upsert({
        where: { teamName: 'Clinical' },
        update: {},
        create: {
          teamName: 'Clinical',
          contactEmail: 'clinical@neurokind.internal',
          slackChannel: 'clinical',
        },
      }),
      prisma.dataOwner.upsert({
        where: { teamName: 'Compliance' },
        update: {},
        create: {
          teamName: 'Compliance',
          contactEmail: 'compliance@neurokind.internal',
          slackChannel: 'compliance',
        },
      }),
    ]);

    console.log(`✅ Created ${dataOwners.length} data owners`);

    // ============================================================================
    // CREATE GLOSSARY TERMS
    // ============================================================================
    console.log('📖 Creating glossary terms...');

    const glossaryTerms = await Promise.all([
      prisma.businessGlossaryTerm.upsert({
        where: { name: 'PII' },
        update: {},
        create: {
          name: 'PII',
          definition: 'Personally Identifiable Information - any data that can be used to identify a specific individual',
          examples: 'Email addresses, phone numbers, IP addresses, user IDs when linked to personal data',
        },
      }),
      prisma.businessGlossaryTerm.upsert({
        where: { name: 'PHI' },
        update: {},
        create: {
          name: 'PHI',
          definition: 'Protected Health Information - health information that can be linked to an individual, protected under HIPAA',
          examples: 'Medical diagnoses, treatment plans, screening results, therapy notes',
        },
      }),
      prisma.businessGlossaryTerm.upsert({
        where: { name: 'Data Retention' },
        update: {},
        create: {
          name: 'Data Retention',
          definition: 'Policy governing how long data must be kept and when it should be deleted',
          examples: 'User data retained for 7 years post-account deletion, audit logs kept for 3 years',
        },
      }),
      prisma.businessGlossaryTerm.upsert({
        where: { name: 'Audit Trail' },
        update: {},
        create: {
          name: 'Audit Trail',
          definition: 'Chronological record of system activities to enable reconstruction and review',
          examples: 'User login events, data modification records, access logs',
        },
      }),
      prisma.businessGlossaryTerm.upsert({
        where: { name: 'Data Lineage' },
        update: {},
        create: {
          name: 'Data Lineage',
          definition: 'Documentation of data origins, movements, transformations, and dependencies',
          examples: 'Tracking how user input flows through screening to reporting',
        },
      }),
      prisma.businessGlossaryTerm.upsert({
        where: { name: 'Consent' },
        update: {},
        create: {
          name: 'Consent',
          definition: 'User permission for data collection, processing, and sharing',
          examples: 'Terms acceptance, privacy policy consent, research participation opt-in',
        },
      }),
    ]);

    console.log(`✅ Created ${glossaryTerms.length} glossary terms`);

    // ============================================================================
    // CREATE CATALOG DATASETS
    // ============================================================================
    console.log('📊 Creating catalog datasets...');

    // User Dataset
    const userDataset = await prisma.dataset.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Core user authentication and identity data for all platform users',
        domain: 'auth',
        ownerTeam: 'Engineering',
        sensitivity: 'PII',
        tags: ['authentication', 'identity', 'core'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: userDataset.id, name: 'id', type: 'String (CUID)', description: 'Unique user identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: userDataset.id, name: 'email', type: 'String', description: 'User email address for authentication', isNullable: false, sensitivity: 'PII', examples: 'user@example.com' },
        { datasetId: userDataset.id, name: 'hashedPassword', type: 'String', description: 'Bcrypt hashed password', isNullable: true, sensitivity: 'SENSITIVE' },
        { datasetId: userDataset.id, name: 'createdAt', type: 'DateTime', description: 'Account creation timestamp', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: userDataset.id, name: 'updatedAt', type: 'DateTime', description: 'Last account update timestamp', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: userDataset.id, name: 'lastLoginAt', type: 'DateTime', description: 'Most recent login timestamp', isNullable: true, sensitivity: 'INTERNAL' },
      ],
      skipDuplicates: true,
    });

    // Profile Dataset
    const profileDataset = await prisma.dataset.upsert({
      where: { name: 'Profile' },
      update: {},
      create: {
        name: 'Profile',
        description: 'Extended user profile information including display settings and verification status',
        domain: 'auth',
        ownerTeam: 'Product',
        sensitivity: 'PII',
        tags: ['profile', 'user-data', 'identity'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: profileDataset.id, name: 'id', type: 'String (CUID)', description: 'Profile identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: profileDataset.id, name: 'userId', type: 'String (FK)', description: 'Reference to user account', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: profileDataset.id, name: 'username', type: 'String', description: 'Public display username', isNullable: false, sensitivity: 'PII', examples: 'parent_alex, therapist_sam' },
        { datasetId: profileDataset.id, name: 'displayName', type: 'String', description: 'Full display name', isNullable: false, sensitivity: 'PII', examples: 'Alex Parent' },
        { datasetId: profileDataset.id, name: 'bio', type: 'Text', description: 'User biography or description', isNullable: true, sensitivity: 'INTERNAL' },
        { datasetId: profileDataset.id, name: 'location', type: 'String', description: 'User location (city/region)', isNullable: true, sensitivity: 'PII', examples: 'San Francisco, CA' },
        { datasetId: profileDataset.id, name: 'verifiedTherapist', type: 'Boolean', description: 'Professional therapist verification status', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: profileDataset.id, name: 'shadowbanned', type: 'Boolean', description: 'Moderation status flag', isNullable: false, sensitivity: 'SENSITIVE' },
      ],
      skipDuplicates: true,
    });

    // Post Dataset
    const postDataset = await prisma.dataset.upsert({
      where: { name: 'Post' },
      update: {},
      create: {
        name: 'Post',
        description: 'Community forum posts created by users seeking support or sharing experiences',
        domain: 'community',
        ownerTeam: 'Product',
        sensitivity: 'SENSITIVE',
        tags: ['community', 'content', 'ugc'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: postDataset.id, name: 'id', type: 'String (CUID)', description: 'Post identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: postDataset.id, name: 'title', type: 'String', description: 'Post title/headline', isNullable: false, sensitivity: 'SENSITIVE', examples: 'Need advice on meltdowns' },
        { datasetId: postDataset.id, name: 'content', type: 'Text', description: 'Full post content (may contain personal stories)', isNullable: false, sensitivity: 'SENSITIVE' },
        { datasetId: postDataset.id, name: 'authorId', type: 'String (FK)', description: 'Reference to post author', isNullable: true, sensitivity: 'INTERNAL' },
        { datasetId: postDataset.id, name: 'isAnonymous', type: 'Boolean', description: 'Whether post is anonymous', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: postDataset.id, name: 'status', type: 'Enum (PostStatus)', description: 'Post moderation/visibility status', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: postDataset.id, name: 'viewCount', type: 'Integer', description: 'Number of views', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: postDataset.id, name: 'voteScore', type: 'Integer', description: 'Net upvotes minus downvotes', isNullable: false, sensitivity: 'INTERNAL' },
      ],
      skipDuplicates: true,
    });

    // Comment Dataset
    const commentDataset = await prisma.dataset.upsert({
      where: { name: 'Comment' },
      update: {},
      create: {
        name: 'Comment',
        description: 'User comments and replies on community posts',
        domain: 'community',
        ownerTeam: 'Product',
        sensitivity: 'SENSITIVE',
        tags: ['community', 'content', 'ugc'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: commentDataset.id, name: 'id', type: 'String (CUID)', description: 'Comment identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: commentDataset.id, name: 'content', type: 'Text', description: 'Comment text content', isNullable: false, sensitivity: 'SENSITIVE' },
        { datasetId: commentDataset.id, name: 'authorId', type: 'String (FK)', description: 'Reference to comment author', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: commentDataset.id, name: 'postId', type: 'String (FK)', description: 'Reference to parent post', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: commentDataset.id, name: 'parentCommentId', type: 'String (FK)', description: 'Reference to parent comment (for nested replies)', isNullable: true, sensitivity: 'INTERNAL' },
        { datasetId: commentDataset.id, name: 'status', type: 'Enum (CommentStatus)', description: 'Comment visibility status', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: commentDataset.id, name: 'isAnonymous', type: 'Boolean', description: 'Whether comment is anonymous', isNullable: false, sensitivity: 'INTERNAL' },
      ],
      skipDuplicates: true,
    });

    // AuditLog Dataset
    const auditLogDataset = await prisma.dataset.upsert({
      where: { name: 'AuditLog' },
      update: {},
      create: {
        name: 'AuditLog',
        description: 'System audit trail for security, compliance, and debugging',
        domain: 'analytics',
        ownerTeam: 'Engineering',
        sensitivity: 'SENSITIVE',
        tags: ['security', 'audit', 'compliance'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: auditLogDataset.id, name: 'id', type: 'String (CUID)', description: 'Audit log entry identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: auditLogDataset.id, name: 'userId', type: 'String (FK)', description: 'User who performed action', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: auditLogDataset.id, name: 'action', type: 'String', description: 'Action type performed', isNullable: false, sensitivity: 'INTERNAL', examples: 'user.login, post.create, user.delete' },
        { datasetId: auditLogDataset.id, name: 'targetType', type: 'String', description: 'Type of entity affected', isNullable: true, sensitivity: 'INTERNAL', examples: 'POST, USER, COMMENT' },
        { datasetId: auditLogDataset.id, name: 'targetId', type: 'String', description: 'ID of affected entity', isNullable: true, sensitivity: 'INTERNAL' },
        { datasetId: auditLogDataset.id, name: 'ipAddress', type: 'String', description: 'Client IP address', isNullable: true, sensitivity: 'PII', examples: '192.168.1.1' },
        { datasetId: auditLogDataset.id, name: 'userAgent', type: 'String', description: 'Client user agent string', isNullable: true, sensitivity: 'INTERNAL' },
        { datasetId: auditLogDataset.id, name: 'changes', type: 'JSON', description: 'Before/after data changes', isNullable: true, sensitivity: 'SENSITIVE' },
      ],
      skipDuplicates: true,
    });

    // Provider Dataset
    const providerDataset = await prisma.dataset.upsert({
      where: { name: 'Provider' },
      update: {},
      create: {
        name: 'Provider',
        description: 'Healthcare and therapy provider directory listings',
        domain: 'providers',
        ownerTeam: 'Clinical',
        sensitivity: 'PUBLIC',
        tags: ['providers', 'directory', 'healthcare'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: providerDataset.id, name: 'id', type: 'String (CUID)', description: 'Provider identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: providerDataset.id, name: 'name', type: 'String', description: 'Provider or practice name', isNullable: false, sensitivity: 'PUBLIC', examples: 'ABC Therapy Center' },
        { datasetId: providerDataset.id, name: 'phone', type: 'String', description: 'Contact phone number', isNullable: true, sensitivity: 'PUBLIC' },
        { datasetId: providerDataset.id, name: 'address', type: 'Text', description: 'Physical address', isNullable: true, sensitivity: 'PUBLIC' },
        { datasetId: providerDataset.id, name: 'email', type: 'String', description: 'Contact email', isNullable: true, sensitivity: 'PUBLIC' },
        { datasetId: providerDataset.id, name: 'latitude', type: 'Float', description: 'GPS latitude for mapping', isNullable: true, sensitivity: 'PUBLIC' },
        { datasetId: providerDataset.id, name: 'longitude', type: 'Float', description: 'GPS longitude for mapping', isNullable: true, sensitivity: 'PUBLIC' },
        { datasetId: providerDataset.id, name: 'isVerified', type: 'Boolean', description: 'Verification status', isNullable: false, sensitivity: 'INTERNAL' },
      ],
      skipDuplicates: true,
    });

    // ModActionLog Dataset
    const modActionDataset = await prisma.dataset.upsert({
      where: { name: 'ModActionLog' },
      update: {},
      create: {
        name: 'ModActionLog',
        description: 'Moderation actions taken by moderators and admins',
        domain: 'moderation',
        ownerTeam: 'Compliance',
        sensitivity: 'SENSITIVE',
        tags: ['moderation', 'compliance', 'safety'],
      },
    });

    await prisma.datasetField.createMany({
      data: [
        { datasetId: modActionDataset.id, name: 'id', type: 'String (CUID)', description: 'Action log identifier', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: modActionDataset.id, name: 'actionType', type: 'Enum (ModerationActionType)', description: 'Type of moderation action', isNullable: false, sensitivity: 'INTERNAL', examples: 'REMOVE, LOCK, SHADOWBAN' },
        { datasetId: modActionDataset.id, name: 'targetType', type: 'Enum (ReportTargetType)', description: 'Type of content moderated', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: modActionDataset.id, name: 'targetId', type: 'String', description: 'ID of moderated content', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: modActionDataset.id, name: 'moderatorId', type: 'String (FK)', description: 'Moderator who took action', isNullable: false, sensitivity: 'INTERNAL' },
        { datasetId: modActionDataset.id, name: 'reason', type: 'String', description: 'Reason for action', isNullable: true, sensitivity: 'SENSITIVE' },
        { datasetId: modActionDataset.id, name: 'notes', type: 'Text', description: 'Additional moderator notes', isNullable: true, sensitivity: 'SENSITIVE' },
      ],
      skipDuplicates: true,
    });

    // Link datasets to glossary terms
    const piiTerm = glossaryTerms.find(t => t.name === 'PII')!;
    const phiTerm = glossaryTerms.find(t => t.name === 'PHI')!;
    const auditTerm = glossaryTerms.find(t => t.name === 'Audit Trail')!;
    const retentionTerm = glossaryTerms.find(t => t.name === 'Data Retention')!;

    await prisma.datasetGlossaryTerm.createMany({
      data: [
        { datasetId: userDataset.id, termId: piiTerm.id },
        { datasetId: userDataset.id, termId: retentionTerm.id },
        { datasetId: profileDataset.id, termId: piiTerm.id },
        { datasetId: auditLogDataset.id, termId: auditTerm.id },
        { datasetId: auditLogDataset.id, termId: retentionTerm.id },
        { datasetId: auditLogDataset.id, termId: piiTerm.id },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ Created 7 datasets with fields and glossary term associations`);

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
    console.log(`   - ${dataOwners.length} data owners created`);
    console.log(`   - ${glossaryTerms.length} glossary terms created`);
    console.log('   - 7 catalog datasets created');
    console.log('\n💡 Test login credentials:');
    console.log('   Admin: admin@neurokind.local / admin123');
    console.log('   Moderator: moderator@neurokind.local / moderator123');
    console.log('   Parent: parent@neurokind.local / parent123');
    console.log('   Therapist: therapist@neurokind.local / therapist123');

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

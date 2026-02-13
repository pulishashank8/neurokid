/**
 * Create Owner Account Script
 * 
 * Usage: node scripts/create-owner.js <email>
 * 
 * This script creates a new user with OWNER role or grants OWNER role to existing user.
 */

const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createOwner() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node scripts/create-owner.js <email>');
    console.log('Example: node scripts/create-owner.js owner@neurokid.com\n');
    process.exit(1);
  }

  console.log('🔐 Owner Account Setup\n');
  console.log(`Email: ${email}`);

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true, profile: true },
    });

    if (!user) {
      // Create new user
      console.log('\n📝 User not found. Creating new account...\n');
      
      const password = await question('Enter password (min 8 characters): ');
      
      if (password.length < 8) {
        console.error('❌ Password must be at least 8 characters');
        process.exit(1);
      }

      const displayName = await question('Enter display name (e.g., John Doe): ');
      const username = await question('Enter username (e.g., johndoe): ');

      const hashedPassword = await bcryptjs.hash(password, 10);
      
      user = await prisma.user.create({
        data: {
          email,
          hashedPassword,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          profile: {
            create: {
              username: username || email.split('@')[0],
              displayName: displayName || 'Owner',
            },
          },
        },
        include: { userRoles: true },
      });
      
      console.log('✅ User account created');
    } else {
      console.log('\n✅ User account found');
    }

    // Check if already has OWNER role
    const hasOwnerRole = user.userRoles.some((r) => r.role === 'OWNER');
    
    if (hasOwnerRole) {
      console.log('✅ User already has OWNER role');
    } else {
      // Grant OWNER role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          role: 'OWNER',
        },
      });
      console.log('✅ OWNER role granted');
    }

    console.log('\n🎉 Owner Account Ready!\n');
    console.log('━'.repeat(50));
    console.log(`Email:     ${email}`);
    console.log(`User ID:   ${user.id}`);
    console.log(`Dashboard: http://localhost:5000/owner/login`);
    console.log('━'.repeat(50));
    console.log('\n📝 Next Steps:');
    console.log('1. Go to http://localhost:5000/owner/login');
    console.log('2. Sign in with your email and password');
    console.log('3. You now have full owner access!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n💡 Tip: A user with this email already exists.');
      console.log('   Use a different email or grant OWNER role via Prisma Studio.\n');
    }
    
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createOwner();

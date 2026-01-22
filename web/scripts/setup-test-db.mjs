// Quick script to create test database
import { execSync } from 'child_process';

console.log('Setting up test database...');

try {
    // Try to create the database using Prisma
    process.env.DATABASE_URL = 'postgresql://postgres:Chowdary@localhost:5432/neurokind_test';

    console.log('Running migrations on test database...');
    execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'postgresql://postgres:Chowdary@localhost:5432/neurokind_test' }
    });

    console.log('✅ Test database setup complete!');
} catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
}

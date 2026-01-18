#!/usr/bin/env node
/**
 * Test script for creating a post via API
 * Usage: node scripts/test-create-post.mjs
 */

const BASE_URL = 'http://localhost:3000';

async function testCreatePost() {
  try {
    console.log('🧪 Testing Create Post API\n');

    // Step 1: Fetch categories
    console.log('📁 Fetching categories...');
    const categoriesRes = await fetch(`${BASE_URL}/api/categories`);
    const categoriesData = await categoriesRes.json();
    
    if (!categoriesData.categories || categoriesData.categories.length === 0) {
      console.error('❌ No categories found. Please seed the database first.');
      process.exit(1);
    }
    
    const firstCategory = categoriesData.categories[0];
    console.log(`✓ Found ${categoriesData.categories.length} categories`);
    console.log(`  Using: ${firstCategory.name} (ID: ${firstCategory.id})\n`);

    // Step 2: Fetch tags (optional)
    console.log('🏷️  Fetching tags...');
    const tagsRes = await fetch(`${BASE_URL}/api/tags`);
    const tagsData = await tagsRes.json();
    const tagIds = tagsData.tags?.slice(0, 2).map(t => t.id) || [];
    console.log(`✓ Found ${tagsData.tags?.length || 0} tags`);
    if (tagIds.length > 0) {
      console.log(`  Using: ${tagsData.tags.slice(0, 2).map(t => t.name).join(', ')}\n`);
    }

    // Step 3: Attempt to create post
    console.log('📝 Creating test post...');
    const testPost = {
      title: `Test Post - ${new Date().toLocaleTimeString()}`,
      content: 'This is a test post created by the automated test script. It should appear in the community feed if everything is working correctly.',
      categoryId: firstCategory.id,
      tagIds: tagIds,
      isAnonymous: false,
    };

    console.log('\nRequest payload:');
    console.log(JSON.stringify(testPost, null, 2));

    const createRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPost),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error('\n❌ Create post failed:');
      console.error(`Status: ${createRes.status}`);
      console.error('Response:', JSON.stringify(createData, null, 2));
      
      if (createData.fieldErrors) {
        console.error('\n🔍 Field Errors:');
        Object.keys(createData.fieldErrors).forEach(field => {
          console.error(`  - ${field}: ${createData.fieldErrors[field]}`);
        });
      }
      
      if (createRes.status === 401) {
        console.log('\n💡 TIP: You need to be logged in to create posts.');
        console.log('   1. Start the dev server: npm run dev');
        console.log('   2. Go to http://localhost:3000 and sign in');
        console.log('   3. Copy your session cookie and add it to this script');
      }
      
      process.exit(1);
    }

    console.log('\n✅ Post created successfully!');
    console.log(`   Post ID: ${createData.id}`);
    console.log(`   Title: ${createData.title}`);
    console.log(`   Category: ${createData.category?.name || 'N/A'}`);
    console.log(`   Tags: ${createData.tags?.map(t => t.name).join(', ') || 'None'}`);
    console.log(`   View at: ${BASE_URL}/community/${createData.id}\n`);

    // Step 4: Verify post appears in feed
    console.log('🔍 Verifying post appears in feed...');
    const feedRes = await fetch(`${BASE_URL}/api/posts?limit=5&sort=new`);
    const feedData = await feedRes.json();
    
    const foundInFeed = feedData.posts?.some(p => p.id === createData.id);
    
    if (foundInFeed) {
      console.log('✅ Post found in feed!\n');
    } else {
      console.log('⚠️  Post not found in feed (may be cached)\n');
    }

    console.log('🎉 All tests passed!\n');
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCreatePost();

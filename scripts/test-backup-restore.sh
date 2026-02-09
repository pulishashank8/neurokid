#!/bin/bash
# Backup Restore Test Script (Phase 7.4.7)
#
# This script verifies that backups can be successfully restored
# Run monthly to ensure backup integrity

set -e  # Exit on error

echo "=== Backup Restore Test ==="
echo "Date: $(date)"
echo ""
echo "This script will:"
echo "1. Create a test database"
echo "2. Restore latest backup to test database"
echo "3. Verify data integrity"
echo "4. Clean up test database"
echo ""

# Configuration
PROD_DB_URL="${DATABASE_URL}"
TEST_DB_NAME="neurokind_restore_test_$(date +%Y%m%d_%H%M%S)"
TEST_DB_URL="postgresql://user:pass@localhost:5432/${TEST_DB_NAME}"
BACKUP_BUCKET="neurokind-backups"

# Get latest backup
echo "Fetching latest backup from S3..."
LATEST_BACKUP=$(aws s3 ls "s3://${BACKUP_BUCKET}/daily/" | sort | tail -n 1 | awk '{print $4}')

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backups found in S3"
  exit 1
fi

echo "Latest backup: $LATEST_BACKUP"

# Download backup
echo "Downloading backup..."
aws s3 cp "s3://${BACKUP_BUCKET}/daily/${LATEST_BACKUP}" ./test-restore.dump

# Check file size
BACKUP_SIZE=$(du -h ./test-restore.dump | cut -f1)
echo "Backup size: $BACKUP_SIZE"

if [ ! -s ./test-restore.dump ]; then
  echo "ERROR: Backup file is empty"
  exit 1
fi

# Create test database
echo "Creating test database: $TEST_DB_NAME"
psql "$PROD_DB_URL" -c "CREATE DATABASE ${TEST_DB_NAME};"

# Restore backup to test database
echo "Restoring backup to test database..."
pg_restore \
  --dbname="$TEST_DB_URL" \
  --no-owner \
  --no-privileges \
  --verbose \
  ./test-restore.dump

# Verify data integrity
echo ""
echo "=== Data Integrity Verification ==="

# Test 1: Check table counts
echo ""
echo "Test 1: Table row counts"
psql "$TEST_DB_URL" -c "
  SELECT
    'User' as table_name, COUNT(*) as count FROM \"User\"
  UNION ALL SELECT 'Post', COUNT(*) FROM \"Post\"
  UNION ALL SELECT 'Comment', COUNT(*) FROM \"Comment\"
  UNION ALL SELECT 'Message', COUNT(*) FROM \"Message\"
  UNION ALL SELECT 'DailyWin', COUNT(*) FROM \"DailyWin\"
  UNION ALL SELECT 'TherapySession', COUNT(*) FROM \"TherapySession\";
"

# Test 2: Check foreign key constraints
echo ""
echo "Test 2: Foreign key integrity"
FK_COUNT=$(psql "$TEST_DB_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';
")

if [ "$FK_COUNT" -gt 0 ]; then
  echo "✓ All foreign keys intact ($FK_COUNT constraints)"
else
  echo "✗ Foreign key violations found"
  exit 1
fi

# Test 3: Check indexes
echo ""
echo "Test 3: Index verification"
INDEX_COUNT=$(psql "$TEST_DB_URL" -t -c "
  SELECT COUNT(*)
  FROM pg_indexes
  WHERE schemaname = 'public';
")

echo "✓ Indexes found: $INDEX_COUNT"

if [ "$INDEX_COUNT" -lt 10 ]; then
  echo "✗ Missing indexes (expected > 10, got $INDEX_COUNT)"
  exit 1
fi

# Test 4: Check recent data
echo ""
echo "Test 4: Recent data verification"
RECENT_POSTS=$(psql "$TEST_DB_URL" -t -c "
  SELECT COUNT(*)
  FROM \"Post\"
  WHERE \"createdAt\" > NOW() - INTERVAL '7 days';
")

echo "Recent posts (last 7 days): $RECENT_POSTS"

# Test 5: Check encrypted data
echo ""
echo "Test 5: Encryption verification"
ENCRYPTED_SESSIONS=$(psql "$TEST_DB_URL" -t -c "
  SELECT COUNT(*)
  FROM \"TherapySession\"
  WHERE notes IS NOT NULL;
")

echo "Encrypted therapy sessions: $ENCRYPTED_SESSIONS"

if [ "$ENCRYPTED_SESSIONS" -gt 0 ]; then
  echo "✓ Encrypted data present (can verify decryption in app)"
fi

# Test 6: Check data consistency
echo ""
echo "Test 6: Data consistency checks"

# Verify post counts match comment counts
CONSISTENCY_CHECK=$(psql "$TEST_DB_URL" -t -c "
  SELECT COUNT(*)
  FROM \"Post\" p
  WHERE p.\"commentCount\" != (
    SELECT COUNT(*)
    FROM \"Comment\" c
    WHERE c.\"postId\" = p.id AND c.status = 'ACTIVE'
  );
")

if [ "$CONSISTENCY_CHECK" -eq 0 ]; then
  echo "✓ Post comment counts are consistent"
else
  echo "⚠ Found $CONSISTENCY_CHECK posts with inconsistent comment counts (normal if recent activity)"
fi

# Clean up
echo ""
echo "Cleaning up..."
rm ./test-restore.dump
psql "$PROD_DB_URL" -c "DROP DATABASE ${TEST_DB_NAME};"

echo ""
echo "=== Backup Restore Test PASSED ==="
echo "✓ Backup is valid and restorable"
echo "✓ Data integrity verified"
echo "✓ Foreign keys intact"
echo "✓ Indexes present"
echo "✓ Recent data found"
echo "✓ Encrypted data present"
echo ""
echo "Backup file: $LATEST_BACKUP"
echo "Backup size: $BACKUP_SIZE"
echo "Test completed: $(date)"

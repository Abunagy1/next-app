#!/bin/bash

# Load environment variables from .env file
set -a
source "$(dirname "$0")/../.env"
set +a

# Configuration
BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/neon_backup_$TIMESTAMP.dump"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Check if DATABASE_URL_UNPOOLED is set
if [ -z "$DATABASE_URL_UNPOOLED" ]; then
    echo "❌ Error: DATABASE_URL_UNPOOLED is not set in .env file."
    exit 1
fi

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump is not installed. Please install PostgreSQL client tools."
    exit 1
fi

echo "🔄 Starting backup of Neon database..."
echo "📁 Backup destination: $BACKUP_FILE"

# Run pg_dump
pg_dump -Fc -v "$DATABASE_URL_UNPOOLED" -f "$BACKUP_FILE"

# Check if backup succeeded
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "   File: $BACKUP_FILE"
    # Optional: show file size
    du -h "$BACKUP_FILE"
else
    echo "❌ Backup failed. Please check your connection string and try again."
    exit 1
fi
#!/usr/bin/env bash
set -euo pipefail

# Scheduled via cron on the VPS, e.g.:
#   0 3 * * * cd /path/to/app && ./scripts/backup.sh >> /var/log/home-manager-backup.log 2>&1
#
# Dumps Postgres, compresses it, and copies it OFF this VPS — a local file
# (even on a separate volume/snapshot) is not a backup if the VPS itself
# is lost, wiped, or compromised.
#
# Uses rclone for the offsite copy because it's storage-agnostic (S3, B2,
# a personal NAS, Google Drive, etc. all work the same way) — but that
# means two things need setting up before this script actually protects
# anything:
#   1. `rclone config` once, to define a remote
#   2. BACKUP_REMOTE below (or exported before calling this script) set to
#      that remote, e.g. "b2:home-manager-backups"
# Until both exist, this script deliberately fails loudly instead of
# quietly leaving the dump sitting only on this VPS.

cd "$(dirname "$0")/.."

BACKUP_DIR="./backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="${BACKUP_DIR}/home_manager-${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_REMOTE="${BACKUP_REMOTE:-}"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U home_manager home_manager | gzip > "$DUMP_FILE"
echo "Dumped to $DUMP_FILE"

if [ -z "$BACKUP_REMOTE" ]; then
  echo "BACKUP_REMOTE is not set — the dump is sitting only on this VPS, which is not a backup." >&2
  echo "Set BACKUP_REMOTE (e.g. 'b2:home-manager-backups') and run 'rclone config' first." >&2
  exit 1
fi

rclone copy "$DUMP_FILE" "$BACKUP_REMOTE"
echo "Copied to $BACKUP_REMOTE"

find "$BACKUP_DIR" -name '*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

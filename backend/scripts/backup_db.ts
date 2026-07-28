import { dirname, join } from '@std/path';
import { config } from '../src/config/env.ts';
import { closeDB, getDB, initDB } from '../src/db/client.ts';

const MAX_BACKUPS = 15;

/**
 * Creates an atomic point-in-time backup of the SQLite database into a backups directory.
 */
export function createBackup(): string | null {
  const dbPath = config.database.path;

  // Check if database exists
  try {
    const stat = Deno.statSync(dbPath);
    if (!stat.isFile) {
      console.log('ℹ️  No database file found to backup.');
      return null;
    }
  } catch (_e) {
    console.log('ℹ️  Database file does not exist yet. Skipping backup.');
    return null;
  }

  // Ensure backups directory exists
  const baseDir = dirname(dbPath);
  const backupsDir = join(baseDir, 'backups');
  try {
    Deno.mkdirSync(backupsDir, { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) {
      console.error('❌ Failed to create backups directory:', e);
      throw e;
    }
  }

  // Generate timestamp filename: pantry_backup_YYYY-MM-DD_HH-MM-SS.db
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFileName = `pantry_backup_${timestamp}.db`;
  const backupFilePath = join(backupsDir, backupFileName);

  console.log(`📦 Creating database backup at: ${backupFilePath}`);

  initDB();
  const db = getDB();

  try {
    // Safe SQLite point-in-time backup using VACUUM INTO
    const sanitizedPath = backupFilePath.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${sanitizedPath}'`);
    console.log(`✅ Backup successfully created: ${backupFileName}`);
  } catch (error) {
    console.error('❌ Failed to execute SQLite backup:', error);
    throw error;
  } finally {
    closeDB();
  }

  // Prune old backups if count > MAX_BACKUPS
  cleanOldBackups(backupsDir, MAX_BACKUPS);

  return backupFilePath;
}

/**
 * Clean up old backup files exceeding maxKeep limit
 */
function cleanOldBackups(backupsDir: string, maxKeep: number) {
  try {
    const files: { name: string; path: string; mtime: number }[] = [];
    for (const entry of Deno.readDirSync(backupsDir)) {
      if (entry.isFile && entry.name.startsWith('pantry_backup_') && entry.name.endsWith('.db')) {
        const fullPath = join(backupsDir, entry.name);
        const stat = Deno.statSync(fullPath);
        files.push({
          name: entry.name,
          path: fullPath,
          mtime: stat.mtime?.getTime() || 0,
        });
      }
    }

    // Sort newest to oldest
    files.sort((a, b) => b.mtime - a.mtime);

    if (files.length > maxKeep) {
      const toDelete = files.slice(maxKeep);
      for (const file of toDelete) {
        console.log(`🧹 Pruning old backup: ${file.name}`);
        try {
          Deno.removeSync(file.path);
        } catch (e) {
          console.warn(`Could not remove old backup ${file.name}:`, e);
        }
      }
    }
  } catch (e) {
    console.warn('Warning during backup cleanup:', e);
  }
}

if (import.meta.main) {
  createBackup();
}

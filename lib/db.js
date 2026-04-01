import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Use persistent data directory - configurable via DATA_DIR env var
// In Hostinger: set DATA_DIR to a persistent volume path
const dataDir = process.env.DATA_DIR 
  || (process.env.HOME ? path.join(process.env.HOME, '.series-tracker-data') : '/tmp/series-tracker-data')

const dbPath = path.join(dataDir, 'tracker.db')

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 })
  console.log(`[SeriesTracker] Database directory created: ${dataDir}`)
}

export function getDb() {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  
  // Init schema from file
  const schemaPath = path.join(process.cwd(), 'schema.sql')
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8')
    db.exec(schema)
  }
  
  // Migration: add tvmaze_id column if it doesn't exist (for existing installs)
  try {
    db.prepare("ALTER TABLE series ADD COLUMN tvmaze_id TEXT").run()
  } catch (e) {
    // Column already exists, ignore
  }
  
  console.log(`[SeriesTracker] Database connected: ${dbPath}`)
  return db
}

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'data', 'tracker.db')

export function getDb() {
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  
  // Init schema
  const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8')
  db.exec(schema)
  
  return db
}

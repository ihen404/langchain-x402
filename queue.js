import Database from 'better-sqlite3';

const db = new Database('x402_queue.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS content_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function enqueueUrl(url) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO content_queue (url) VALUES (?)
  `);
  return stmt.run(url);
}

export function getNextPendingUrl() {
  const stmt = db.prepare(`
    SELECT * FROM content_queue 
    WHERE status = 'pending' 
    ORDER BY id ASC 
    LIMIT 1
  `);
  return stmt.get();
}

export function updateQueueStatus(id, status) {
  const stmt = db.prepare(`
    UPDATE content_queue 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  return stmt.run(status, id);
}

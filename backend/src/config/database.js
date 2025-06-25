const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

let db;

function initializeDatabase() {
  try {
    const dbPath = path.resolve(process.env.DATABASE_PATH || "./data/pal.db");
    const dbDir = path.dirname(dbPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    // Create tables
    createTables();

    logger.info(`📊 Database initialized at: ${dbPath}`);
  } catch (error) {
    logger.error("❌ Database initialization failed:", error);
    throw error;
  }
}

function createTables() {
  // Documents table
  db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            originalName TEXT NOT NULL,
            mimeType TEXT NOT NULL,
            size INTEGER NOT NULL,
            content TEXT,
            metadata TEXT,
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            processedAt DATETIME,
            status TEXT DEFAULT 'pending'
        )
    `);

  // Chat sessions table
  db.exec(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Chat messages table
  db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            sessionId TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            metadata TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sessionId) REFERENCES chat_sessions (id) ON DELETE CASCADE
        )
    `);

  // Document chunks table for vector storage
  db.exec(`
        CREATE TABLE IF NOT EXISTS document_chunks (
            id TEXT PRIMARY KEY,
            documentId TEXT NOT NULL,
            content TEXT NOT NULL,
            startIndex INTEGER,
            endIndex INTEGER,
            embedding TEXT,
            metadata TEXT,
            FOREIGN KEY (documentId) REFERENCES documents (id) ON DELETE CASCADE
        )
    `);

  // Create indexes
  db.exec(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(sessionId);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
        CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(documentId);
        CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updatedAt);
    `);

  logger.info("✅ Database tables created successfully");
}

function getDatabase() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

// Database helper functions
const dbHelpers = {
  // Document operations
  insertDocument: (document) => {
    const stmt = db.prepare(`
            INSERT INTO documents (id, filename, originalName, mimeType, size, content, metadata, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
    return stmt.run(
      document.id,
      document.filename,
      document.originalName,
      document.mimeType,
      document.size,
      document.content,
      JSON.stringify(document.metadata || {}),
      document.status || "pending"
    );
  },

  getDocuments: () => {
    const stmt = db.prepare("SELECT * FROM documents ORDER BY uploadedAt DESC");
    return stmt.all().map((doc) => ({
      ...doc,
      metadata: JSON.parse(doc.metadata || "{}"),
    }));
  },

  getDocumentById: (id) => {
    const stmt = db.prepare("SELECT * FROM documents WHERE id = ?");
    const doc = stmt.get(id);
    if (doc) {
      doc.metadata = JSON.parse(doc.metadata || "{}");
    }
    return doc;
  },

  updateDocumentStatus: (id, status, processedAt = null) => {
    const stmt = db.prepare(
      "UPDATE documents SET status = ?, processedAt = ? WHERE id = ?"
    );
    return stmt.run(status, processedAt || new Date().toISOString(), id);
  },

  deleteDocument: (id) => {
    const stmt = db.prepare("DELETE FROM documents WHERE id = ?");
    return stmt.run(id);
  },

  // Chat session operations
  insertChatSession: (session) => {
    const stmt = db.prepare(`
            INSERT INTO chat_sessions (id, title, createdAt, updatedAt)
            VALUES (?, ?, ?, ?)
        `);
    return stmt.run(
      session.id,
      session.title,
      session.createdAt || new Date().toISOString(),
      session.updatedAt || new Date().toISOString()
    );
  },

  getChatSessions: () => {
    const stmt = db.prepare(
      "SELECT * FROM chat_sessions ORDER BY updatedAt DESC"
    );
    return stmt.all();
  },

  getChatSessionById: (id) => {
    const stmt = db.prepare("SELECT * FROM chat_sessions WHERE id = ?");
    return stmt.get(id);
  },

  updateChatSession: (id, updates) => {
    const stmt = db.prepare(
      "UPDATE chat_sessions SET title = ?, updatedAt = ? WHERE id = ?"
    );
    return stmt.run(updates.title, new Date().toISOString(), id);
  },

  deleteChatSession: (id) => {
    const stmt = db.prepare("DELETE FROM chat_sessions WHERE id = ?");
    return stmt.run(id);
  },

  // Chat message operations
  insertChatMessage: (message) => {
    const stmt = db.prepare(`
            INSERT INTO chat_messages (id, sessionId, role, content, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
    return stmt.run(
      message.id,
      message.sessionId,
      message.role,
      message.content,
      JSON.stringify(message.metadata || {}),
      message.timestamp || new Date().toISOString()
    );
  },

  getChatMessages: (sessionId) => {
    const stmt = db.prepare(
      "SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC"
    );
    return stmt.all(sessionId).map((msg) => ({
      ...msg,
      metadata: JSON.parse(msg.metadata || "{}"),
    }));
  },

  // Document chunk operations
  insertDocumentChunk: (chunk) => {
    const stmt = db.prepare(`
            INSERT INTO document_chunks (id, documentId, content, startIndex, endIndex, embedding, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
    return stmt.run(
      chunk.id,
      chunk.documentId,
      chunk.content,
      chunk.startIndex,
      chunk.endIndex,
      chunk.embedding ? JSON.stringify(chunk.embedding) : null,
      JSON.stringify(chunk.metadata || {})
    );
  },

  getDocumentChunks: (documentId) => {
    const stmt = db.prepare(
      "SELECT * FROM document_chunks WHERE documentId = ?"
    );
    return stmt.all(documentId).map((chunk) => ({
      ...chunk,
      embedding: chunk.embedding ? JSON.parse(chunk.embedding) : null,
      metadata: JSON.parse(chunk.metadata || "{}"),
    }));
  },

  getAllChunks: () => {
    if (!db) {
      logger.warn("Database not initialized when trying to get all chunks");
      return [];
    }
    const stmt = db.prepare("SELECT * FROM document_chunks");
    return stmt.all().map((chunk) => ({
      ...chunk,
      embedding: chunk.embedding ? JSON.parse(chunk.embedding) : null,
      metadata: JSON.parse(chunk.metadata || "{}"),
    }));
  },

  deleteDocumentChunks: (documentId) => {
    const stmt = db.prepare("DELETE FROM document_chunks WHERE documentId = ?");
    return stmt.run(documentId);
  },
};

module.exports = {
  initializeDatabase,
  getDatabase,
  ...dbHelpers,
};

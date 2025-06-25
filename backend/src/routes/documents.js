const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { upload, getFileInfo, cleanupFile } = require("../utils/fileUpload");
const documentProcessor = require("../services/documentProcessor");
const vectorStore = require("../services/vectorStore");
const logger = require("../utils/logger");
const {
  insertDocument,
  getDocuments,
  getDocumentById,
  updateDocumentStatus,
  deleteDocument,
  deleteDocumentChunks,
} = require("../config/database");

const router = express.Router();

// POST /api/v1/documents/upload - Upload and process a document
router.post("/upload", upload.single("document"), async (req, res, next) => {
  let documentId;
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const fileInfo = getFileInfo(req.file);
    documentId = uuidv4();
    filePath = req.file.path;

    // Save document metadata to database
    insertDocument({
      id: documentId,
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      status: "processing",
      metadata: {
        uploadedAt: new Date().toISOString(),
        extension: fileInfo.extension,
      },
    });

    logger.info(`Document uploaded: ${documentId} (${fileInfo.originalName})`);

    // Process document asynchronously
    setImmediate(async () => {
      try {
        const result = await documentProcessor.processDocument(
          filePath,
          documentId,
          fileInfo.mimeType
        );

        // Update document status and content
        updateDocumentStatus(documentId, "completed");

        // Refresh vector store
        await vectorStore.refreshStore();

        logger.info(`Document processing completed: ${documentId}`);
      } catch (error) {
        logger.error(`Error processing document ${documentId}:`, error);
        updateDocumentStatus(documentId, "failed");
      } finally {
        // Clean up uploaded file
        cleanupFile(filePath);
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: documentId,
        filename: fileInfo.originalName,
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        status: "processing",
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Clean up on error
    if (filePath) {
      cleanupFile(filePath);
    }
    if (documentId) {
      try {
        deleteDocument(documentId);
      } catch (deleteError) {
        logger.error("Error cleaning up failed document:", deleteError);
      }
    }

    logger.error("Error in document upload:", error);
    next(error);
  }
});

// GET /api/v1/documents - Get all documents
router.get("/", async (req, res, next) => {
  try {
    const documents = getDocuments();

    res.json({
      success: true,
      data: documents.map((doc) => ({
        id: doc.id,
        filename: doc.originalName,
        size: doc.size,
        mimeType: doc.mimeType,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        processedAt: doc.processedAt,
        metadata: doc.metadata,
      })),
    });

    logger.debug(`Retrieved ${documents.length} documents`);
  } catch (error) {
    logger.error("Error getting documents:", error);
    next(error);
  }
});

// GET /api/v1/documents/:id - Get specific document
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = getDocumentById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: document.id,
        filename: document.originalName,
        size: document.size,
        mimeType: document.mimeType,
        status: document.status,
        uploadedAt: document.uploadedAt,
        processedAt: document.processedAt,
        metadata: document.metadata,
        contentPreview: document.content
          ? document.content.substring(0, 500) + "..."
          : null,
      },
    });

    logger.debug(`Retrieved document ${id}`);
  } catch (error) {
    logger.error("Error getting document:", error);
    next(error);
  }
});

// POST /api/v1/documents/:id/reprocess - Reprocess a document
router.post("/:id/reprocess", async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = getDocumentById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    if (document.status === "processing") {
      return res.status(400).json({
        success: false,
        error: "Document is already being processed",
      });
    }

    // Update status to processing
    updateDocumentStatus(id, "processing");

    // Check if original file still exists
    const originalPath = path.join(
      process.env.UPLOAD_DIR || "./uploads",
      document.filename
    );
    if (!fs.existsSync(originalPath)) {
      updateDocumentStatus(id, "failed");
      return res.status(400).json({
        success: false,
        error: "Original file not found. Please re-upload the document.",
      });
    }

    // Reprocess asynchronously
    setImmediate(async () => {
      try {
        await documentProcessor.reprocessDocument(
          id,
          originalPath,
          document.mimeType
        );
        updateDocumentStatus(id, "completed");
        await vectorStore.refreshStore();
        logger.info(`Document reprocessing completed: ${id}`);
      } catch (error) {
        logger.error(`Error reprocessing document ${id}:`, error);
        updateDocumentStatus(id, "failed");
      }
    });

    res.json({
      success: true,
      message: "Document reprocessing started",
      data: {
        id,
        status: "processing",
      },
    });

    logger.info(`Started reprocessing document ${id}`);
  } catch (error) {
    logger.error("Error reprocessing document:", error);
    next(error);
  }
});

// DELETE /api/v1/documents/:id - Delete a document
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = getDocumentById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    // Delete from vector store
    await vectorStore.removeChunks(id);

    // Delete document chunks from database
    deleteDocumentChunks(id);

    // Delete document record
    deleteDocument(id);

    // Clean up file if it exists
    const filePath = path.join(
      process.env.UPLOAD_DIR || "./uploads",
      document.filename
    );
    if (fs.existsSync(filePath)) {
      cleanupFile(filePath);
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });

    logger.info(`Deleted document ${id} (${document.originalName})`);
  } catch (error) {
    logger.error("Error deleting document:", error);
    next(error);
  }
});

// GET /api/v1/documents/stats - Get document statistics
router.get("/stats/summary", async (req, res, next) => {
  try {
    const documents = getDocuments();
    const vectorStats = await vectorStore.getStats();

    const stats = {
      totalDocuments: documents.length,
      documentsByStatus: {
        completed: documents.filter((d) => d.status === "completed").length,
        processing: documents.filter((d) => d.status === "processing").length,
        failed: documents.filter((d) => d.status === "failed").length,
        pending: documents.filter((d) => d.status === "pending").length,
      },
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      ...vectorStats,
    };

    res.json({
      success: true,
      data: stats,
    });

    logger.debug("Retrieved document statistics");
  } catch (error) {
    logger.error("Error getting document stats:", error);
    next(error);
  }
});

module.exports = router;

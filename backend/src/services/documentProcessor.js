const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const llmService = require("./llmService");
const { insertDocumentChunk } = require("../config/database");

class DocumentProcessor {
  constructor() {
    this.chunkSize = 1000; // characters per chunk
    this.chunkOverlap = 200; // character overlap between chunks
  }

  async processDocument(filePath, documentId, mimeType) {
    try {
      logger.info(`Processing document: ${filePath}, type: ${mimeType}`);

      let content = "";

      switch (mimeType) {
        case "application/pdf":
          content = await this.processPDF(filePath);
          break;
        case "text/html":
          content = await this.processHTML(filePath);
          break;
        case "text/plain":
          content = await this.processText(filePath);
          break;
        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          content = await this.processDoc(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Clean and validate content
      content = this.cleanContent(content);
      if (!content || content.length < 50) {
        throw new Error("Document content is too short or empty");
      }

      // Create chunks
      const chunks = this.createChunks(content);

      // Process chunks with embeddings
      const processedChunks = await this.processChunks(chunks, documentId);

      logger.info(
        `Document processed successfully: ${processedChunks.length} chunks created`
      );
      return {
        content,
        chunks: processedChunks,
        metadata: {
          chunksCount: processedChunks.length,
          contentLength: content.length,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);
      throw error;
    }
  }

  async processPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      logger.error("Error processing PDF:", error);
      throw new Error("Failed to parse PDF file");
    }
  }

  async processHTML(filePath) {
    try {
      const htmlContent = fs.readFileSync(filePath, "utf-8");
      const $ = cheerio.load(htmlContent);

      // Remove script and style elements
      $("script, style, nav, footer, header").remove();

      // Extract main content
      let content = $("main").text() || $("article").text() || $("body").text();

      return content;
    } catch (error) {
      logger.error("Error processing HTML:", error);
      throw new Error("Failed to parse HTML file");
    }
  }

  async processText(filePath) {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      logger.error("Error processing text file:", error);
      throw new Error("Failed to read text file");
    }
  }

  async processDoc(filePath) {
    // For now, treat as text file
    // In production, you might want to use libraries like mammoth for .docx
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      logger.error("Error processing document file:", error);
      throw new Error(
        "Failed to process document file. Please convert to PDF or text format."
      );
    }
  }

  cleanContent(content) {
    if (!content) return "";

    return (
      content
        // Remove extra whitespace
        .replace(/\s+/g, " ")
        // Remove special characters that might cause issues
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Trim
        .trim()
    );
  }

  createChunks(content) {
    const chunks = [];
    const words = content.split(" ");
    let currentChunk = "";
    let currentLength = 0;

    for (const word of words) {
      const wordLength = word.length + 1; // +1 for space

      if (currentLength + wordLength > this.chunkSize && currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          startIndex: content.indexOf(currentChunk.trim()),
          endIndex:
            content.indexOf(currentChunk.trim()) + currentChunk.trim().length,
        });

        // Create overlap for next chunk
        const overlapWords = currentChunk
          .split(" ")
          .slice(-Math.floor(this.chunkOverlap / 10));
        currentChunk = overlapWords.join(" ") + " ";
        currentLength = currentChunk.length;
      }

      currentChunk += word + " ";
      currentLength += wordLength;
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        startIndex: content.lastIndexOf(currentChunk.trim()),
        endIndex: content.length,
      });
    }

    return chunks;
  }

  async processChunks(chunks, documentId) {
    const processedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        const chunkId = uuidv4();

        // Generate embedding
        const embedding = await llmService.generateEmbedding(chunk.content);

        // Create chunk object
        const processedChunk = {
          id: chunkId,
          documentId,
          content: chunk.content,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          embedding,
          metadata: {
            chunkIndex: i,
            wordCount: chunk.content.split(" ").length,
            createdAt: new Date().toISOString(),
          },
        };

        // Save to database
        insertDocumentChunk(processedChunk);
        processedChunks.push(processedChunk);

        logger.debug(
          `Processed chunk ${i + 1}/${chunks.length} for document ${documentId}`
        );
      } catch (error) {
        logger.error(
          `Error processing chunk ${i} for document ${documentId}:`,
          error
        );
        // Continue with other chunks
      }
    }

    return processedChunks;
  }

  async reprocessDocument(documentId, filePath, mimeType) {
    try {
      // Delete existing chunks
      const { deleteDocumentChunks } = require("../config/database");
      deleteDocumentChunks(documentId);

      // Reprocess
      return await this.processDocument(filePath, documentId, mimeType);
    } catch (error) {
      logger.error(`Error reprocessing document ${documentId}:`, error);
      throw error;
    }
  }

  extractMetadata(filePath, mimeType) {
    try {
      const stats = fs.statSync(filePath);
      return {
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        mimeType,
        path: filePath,
      };
    } catch (error) {
      logger.error("Error extracting file metadata:", error);
      return {};
    }
  }
}

module.exports = new DocumentProcessor();

const logger = require("../utils/logger");

class VectorStore {
  constructor() {
    this.chunks = [];
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadChunks();
      this.isInitialized = true;
      logger.info("Vector store initialized successfully");
    } catch (error) {
      logger.error("Error initializing vector store:", error);
    }
  }

  async loadChunks() {
    try {
      // Import database functions here to avoid circular dependency issues
      const { getAllChunks } = require("../config/database");
      this.chunks = getAllChunks();
      logger.info(`Loaded ${this.chunks.length} chunks into vector store`);
    } catch (error) {
      logger.error("Error loading chunks into vector store:", error);
      this.chunks = [];
    }
  }

  async addChunk(chunk) {
    this.chunks.push(chunk);
    logger.debug(`Added chunk ${chunk.id} to vector store`);
  }

  async removeChunks(documentId) {
    const initialLength = this.chunks.length;
    this.chunks = this.chunks.filter(
      (chunk) => chunk.documentId !== documentId
    );
    const removedCount = initialLength - this.chunks.length;
    logger.info(
      `Removed ${removedCount} chunks for document ${documentId} from vector store`
    );
  }

  async search(query, limit = 5, threshold = 0.3) {
    try {
      // Ensure vector store is initialized
      await this.initialize();

      if (this.chunks.length === 0) {
        await this.loadChunks();
      }

      if (this.chunks.length === 0) {
        return [];
      }

      // Generate embedding for query
      const llmService = require("./llmService");
      const queryEmbedding = await llmService.generateEmbedding(query);

      // Calculate similarities
      const similarities = this.chunks.map((chunk) => {
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          chunk.embedding
        );
        return {
          ...chunk,
          similarity,
        };
      });

      // Filter by threshold and sort by similarity
      const results = similarities
        .filter((chunk) => chunk.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      logger.debug(
        `Vector search found ${results.length} relevant chunks for query`
      );
      return results;
    } catch (error) {
      logger.error("Error in vector search:", error);
      return this.fallbackSearch(query, limit);
    }
  }

  fallbackSearch(query, limit = 5) {
    try {
      // Simple text-based search as fallback
      const queryWords = query
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2);

      const results = this.chunks.map((chunk) => {
        const content = chunk.content.toLowerCase();
        let score = 0;

        queryWords.forEach((word) => {
          const matches = (content.match(new RegExp(word, "g")) || []).length;
          score += matches;
        });

        return {
          ...chunk,
          similarity: score / queryWords.length,
        };
      });

      const filteredResults = results
        .filter((chunk) => chunk.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      logger.debug(
        `Fallback search found ${filteredResults.length} relevant chunks`
      );
      return filteredResults;
    } catch (error) {
      logger.error("Error in fallback search:", error);
      return [];
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async getRelevantContext(query, maxChunks = 3) {
    const relevantChunks = await this.search(query, maxChunks);

    return relevantChunks.map((chunk) => ({
      content: chunk.content,
      documentId: chunk.documentId,
      similarity: chunk.similarity,
      metadata: chunk.metadata,
    }));
  }

  async refreshStore() {
    await this.initialize();
    await this.loadChunks();
    logger.info("Vector store refreshed");
  }

  async getStats() {
    await this.initialize();

    const documentIds = [
      ...new Set(this.chunks.map((chunk) => chunk.documentId)),
    ];
    return {
      totalChunks: this.chunks.length,
      totalDocuments: documentIds.length,
      averageChunkSize:
        this.chunks.length > 0
          ? Math.round(
              this.chunks.reduce(
                (sum, chunk) => sum + chunk.content.length,
                0
              ) / this.chunks.length
            )
          : 0,
    };
  }
}

module.exports = new VectorStore();

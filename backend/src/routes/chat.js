const express = require("express");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const llmService = require("../services/llmService");
const vectorStore = require("../services/vectorStore");
const searchService = require("../services/searchService");
const {
  insertChatSession,
  getChatSessions,
  getChatSessionById,
  updateChatSession,
  deleteChatSession,
  insertChatMessage,
  getChatMessages,
} = require("../config/database");

const router = express.Router();

// POST /api/v1/chat - Send a message and get AI response
router.post("/", async (req, res, next) => {
  try {
    const { message, sessionId: providedSessionId } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a non-empty string",
      });
    }

    let sessionId = providedSessionId;

    // Create new session if none provided
    if (!sessionId) {
      sessionId = uuidv4();
      const sessionTitle =
        message.length > 50 ? message.substring(0, 50) + "..." : message;

      insertChatSession({
        id: sessionId,
        title: sessionTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      logger.info(`Created new chat session: ${sessionId}`);
    } else {
      // Verify session exists
      const existingSession = getChatSessionById(sessionId);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          error: "Chat session not found",
        });
      }
    }

    // Save user message
    const userMessageId = uuidv4();
    insertChatMessage({
      id: userMessageId,
      sessionId,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Get conversation history
    const chatHistory = getChatMessages(sessionId);
    const conversationMessages = chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Search for relevant context in documents
    let context = [];
    let searchedWeb = false;
    let webResults = null;

    try {
      context = await vectorStore.getRelevantContext(message, 3);
      logger.info(`Found ${context.length} relevant document chunks`);
    } catch (error) {
      logger.error("Error searching document context:", error);
    }

    // If no relevant context found, search the web
    if (context.length === 0 && searchService.isWebSearchAvailable()) {
      try {
        webResults = await searchService.getWebContext(message, 3);
        if (webResults) {
          context = [
            {
              content: webResults.context,
              documentId: "web-search",
              similarity: 0.8,
              metadata: { source: "web", results: webResults.sources },
            },
          ];
          searchedWeb = true;
        }
        logger.info("Used web search for context");
      } catch (error) {
        logger.error("Error in web search:", error);
      }
    }

    // Generate AI response
    const aiResponse = await llmService.generateResponse(
      conversationMessages,
      context,
      {
        maxTokens: 1000,
        temperature: 0.7,
      }
    );

    // Save assistant message
    const assistantMessageId = uuidv4();
    insertChatMessage({
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: aiResponse.content,
      metadata: {
        model: aiResponse.model,
        provider: aiResponse.provider,
        usage: aiResponse.usage,
        contextSources: context.length,
        searchedWeb,
        sources: webResults?.sources || [],
      },
      timestamp: new Date().toISOString(),
    });

    // Update session timestamp
    updateChatSession(sessionId, {
      title: getChatSessionById(sessionId).title,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        sessionId,
        message: {
          id: assistantMessageId,
          role: "assistant",
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
        },
        context: {
          documentsUsed: context.filter((c) => c.documentId !== "web-search")
            .length,
          webSearchUsed: searchedWeb,
          sources: webResults?.sources || [],
        },
        usage: aiResponse.usage,
      },
    });

    logger.info(`Chat response generated for session ${sessionId}`);
  } catch (error) {
    logger.error("Error in chat endpoint:", error);
    next(error);
  }
});

// GET /api/v1/chat/sessions - Get all chat sessions
router.get("/sessions", async (req, res, next) => {
  try {
    const sessions = getChatSessions();

    // Add message count and last message to each session
    const sessionsWithDetails = sessions.map((session) => {
      const messages = getChatMessages(session.id);
      const lastMessage = messages[messages.length - 1];

      return {
        ...session,
        messageCount: messages.length,
        lastMessage: lastMessage
          ? {
              content:
                lastMessage.content.substring(0, 100) +
                (lastMessage.content.length > 100 ? "..." : ""),
              timestamp: lastMessage.timestamp,
              role: lastMessage.role,
            }
          : null,
      };
    });

    res.json({
      success: true,
      data: sessionsWithDetails,
    });

    logger.debug(`Retrieved ${sessions.length} chat sessions`);
  } catch (error) {
    logger.error("Error getting chat sessions:", error);
    next(error);
  }
});

// GET /api/v1/chat/sessions/:sessionId - Get specific session with messages
router.get("/sessions/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = getChatSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      });
    }

    const messages = getChatMessages(sessionId);

    res.json({
      success: true,
      data: {
        ...session,
        messages,
      },
    });

    logger.debug(
      `Retrieved session ${sessionId} with ${messages.length} messages`
    );
  } catch (error) {
    logger.error("Error getting chat session:", error);
    next(error);
  }
});

// PUT /api/v1/chat/sessions/:sessionId - Update session (e.g., title)
router.put("/sessions/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    const session = getChatSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      });
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Title is required and must be a non-empty string",
      });
    }

    updateChatSession(sessionId, {
      title: title.trim(),
      updatedAt: new Date().toISOString(),
    });

    const updatedSession = getChatSessionById(sessionId);

    res.json({
      success: true,
      data: updatedSession,
    });

    logger.info(`Updated session ${sessionId} title`);
  } catch (error) {
    logger.error("Error updating chat session:", error);
    next(error);
  }
});

// DELETE /api/v1/chat/sessions/:sessionId - Delete session
router.delete("/sessions/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = getChatSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Chat session not found",
      });
    }

    deleteChatSession(sessionId);

    res.json({
      success: true,
      message: "Chat session deleted successfully",
    });

    logger.info(`Deleted chat session ${sessionId}`);
  } catch (error) {
    logger.error("Error deleting chat session:", error);
    next(error);
  }
});

module.exports = router;

const OpenAI = require("openai");
const axios = require("axios");
const logger = require("../utils/logger");

class LLMService {
  constructor() {
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize OpenAI
    if (
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
    ) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info("✅ OpenAI client initialized");
    }

    // Initialize Gemini (Google AI)
    if (
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
    ) {
      this.geminiApiKey = process.env.GEMINI_API_KEY;
      logger.info("✅ Gemini API key configured");
    }

    this.provider = process.env.LLM_PROVIDER || "openai";
    this.model =
      this.provider === "openai"
        ? process.env.OPENAI_MODEL || "gpt-3.5-turbo"
        : process.env.GEMINI_MODEL || "gemini-pro";
  }

  async generateResponse(messages, context = null, options = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const formattedMessages = this.formatMessages(messages, systemPrompt);

      if (this.provider === "openai" && this.openai) {
        return await this.generateOpenAIResponse(formattedMessages, options);
      } else if (this.provider === "gemini" && this.geminiApiKey) {
        return await this.generateGeminiResponse(formattedMessages, options);
      } else {
        throw new Error(
          `LLM provider ${this.provider} not available or not configured`
        );
      }
    } catch (error) {
      // Avoid logging circular structures
      const errorMsg = error.message || "Unknown error occurred";
      logger.error("Error generating LLM response:", { message: errorMsg });
      throw new Error(errorMsg);
    }
  }

  buildSystemPrompt(context) {
    let prompt = `You are Pal, an AI assistant designed to help answer questions based on provided documentation and knowledge base.

INSTRUCTIONS:
1. Answer questions using the provided context when available
2. If the context doesn't contain relevant information, clearly state this and provide general guidance
3. Be helpful, accurate, and concise
4. Always maintain a friendly and professional tone
5. If you need to search for additional information, indicate this clearly

CAPABILITIES:
- Analyze documents (PDF, HTML, text files)
- Answer questions based on uploaded FAQ content
- Provide general assistance when specific information isn't available
- Search the web for additional information when needed`;

    if (context && context.length > 0) {
      prompt += `\n\nRELEVANT CONTEXT:\n${context
        .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
        .join("\n\n")}`;
    }

    return prompt;
  }

  formatMessages(messages, systemPrompt) {
    const formattedMessages = [{ role: "system", content: systemPrompt }];

    messages.forEach((msg) => {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    return formattedMessages;
  }

  async generateOpenAIResponse(messages, options = {}) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        provider: "openai",
      };
    } catch (error) {
      logger.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateGeminiResponse(messages, options = {}) {
    try {
      // Convert messages to Gemini format
      const contents = [];

      messages.forEach((msg) => {
        if (msg.role === "system") {
          // Add system message as the first user message
          contents.push({
            role: "user",
            parts: [{ text: `System Instructions: ${msg.content}` }],
          });
        } else if (msg.role === "user") {
          contents.push({
            role: "user",
            parts: [{ text: msg.content }],
          });
        } else if (msg.role === "assistant") {
          contents.push({
            role: "model",
            parts: [{ text: msg.content }],
          });
        }
      });

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: contents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            topK: options.topK || 40,
            topP: options.topP || 0.95,
            maxOutputTokens: options.maxTokens || 1000,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("No content in Gemini response");
      }

      return {
        content: content,
        usage: response.data.usageMetadata || {},
        model: this.model,
        provider: "gemini",
      };
    } catch (error) {
      // Avoid logging circular structures
      const errorMsg = error.response?.data?.error?.message || error.message;
      const errorStatus = error.response?.status;
      logger.error("Gemini API error:", {
        message: errorMsg,
        status: errorStatus,
        model: this.model,
      });
      throw new Error(`Gemini API error: ${errorMsg}`);
    }
  }

  async generateEmbedding(text) {
    try {
      if (process.env.EMBEDDINGS_PROVIDER === "openai" && this.openai) {
        const response = await this.openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: text,
        });
        return response.data[0].embedding;
      } else if (
        process.env.EMBEDDINGS_PROVIDER === "gemini" &&
        this.geminiApiKey
      ) {
        return await this.generateGeminiEmbedding(text);
      } else {
        // Fallback to simple text hashing for development
        logger.warn("No embedding provider configured, using simple hash");
        return this.simpleEmbedding(text);
      }
    } catch (error) {
      const errorMsg = error.message || "Unknown embedding error";
      logger.error("Error generating embedding:", { message: errorMsg });
      return this.simpleEmbedding(text);
    }
  }

  async generateGeminiEmbedding(text) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${this.geminiApiKey}`;

      const response = await axios.post(
        url,
        {
          model: "models/embedding-001",
          content: {
            parts: [
              {
                text: text,
              },
            ],
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.data &&
        response.data.embedding &&
        response.data.embedding.values
      ) {
        return response.data.embedding.values;
      } else {
        throw new Error("Invalid embedding response from Gemini");
      }
    } catch (error) {
      // Avoid logging circular structures
      const errorMsg = error.response?.data?.error?.message || error.message;
      const errorStatus = error.response?.status;
      logger.error("Error generating Gemini embedding:", {
        message: errorMsg,
        status: errorStatus,
      });
      throw new Error(`Gemini embedding error: ${errorMsg}`);
    }
  }

  simpleEmbedding(text) {
    // Simple embedding fallback for development
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2);
    const vector = new Array(384).fill(0);

    words.forEach((word, index) => {
      for (let i = 0; i < word.length; i++) {
        const pos = (word.charCodeAt(i) + index) % vector.length;
        vector[pos] += 1;
      }
    });

    // Normalize
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return magnitude > 0 ? vector.map((val) => val / magnitude) : vector;
  }

  async summarizeText(text, maxLength = 200) {
    try {
      const messages = [
        {
          role: "user",
          content: `Please provide a concise summary of the following text in ${maxLength} characters or less:\n\n${text}`,
        },
      ];

      const response = await this.generateResponse(messages, null, {
        maxTokens: 150,
      });
      return response.content;
    } catch (error) {
      logger.error("Error summarizing text:", error);
      return text.substring(0, maxLength) + "...";
    }
  }
}

module.exports = new LLMService();

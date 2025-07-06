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
    let prompt = `You are Pal, a friendly and helpful AI assistant. Your role is to provide natural, conversational responses to user questions.

PERSONALITY & TONE:
- Be warm, friendly, and approachable in your responses
- Speak naturally as if you're having a conversation with a friend or colleague
- Avoid formal phrases like "Based on the provided text" or "According to the documentation"
- Use simple, clear language and be genuinely helpful
- Show enthusiasm when appropriate and be encouraging

RESPONSE STYLE:
- Start directly with the answer or helpful information
- Use phrases like "I can help you with that!" or "Here's what I found..."
- When referencing information, say things like "I see that..." or "From what I know..."
- If you're not sure about something, be honest: "I'm not entirely sure about that, but..."
- End responses helpfully: "Let me know if you need anything else!" or "Hope that helps!"

GUIDELINES:
- Answer questions using available information when possible
- If you don't have specific information, clearly explain this and offer general guidance
- Be concise but thorough - don't overwhelm with unnecessary details
- If you need to search for more information, mention it naturally
- Always aim to be genuinely helpful and solution-oriented`;

    if (context && context.length > 0) {
      prompt += `\n\nHERE'S SOME RELEVANT INFORMATION I FOUND:\n${context
        .map((chunk, index) => `${chunk.content}`)
        .join("\n\n")}`;
    }

    prompt += `\n\nRemember: Respond naturally and conversationally. Avoid robotic phrases and be genuinely helpful!`;

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
        temperature: options.temperature || 0.8, // Slightly higher for more natural responses
        top_p: options.topP || 0.9,
        frequency_penalty: options.frequencyPenalty || 0.1, // Reduce repetitive phrases
        presence_penalty: options.presencePenalty || 0.1, // Encourage varied language
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
            temperature: options.temperature || 0.8, // Higher for more natural responses
            topK: options.topK || 30,
            topP: options.topP || 0.9,
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

const axios = require("axios");
const logger = require("../utils/logger");

class SearchService {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.bingApiKey = process.env.BING_SEARCH_KEY;
  }

  async searchWeb(query, maxResults = 3) {
    try {
      if (this.serpApiKey) {
        return await this.searchWithSerpAPI(query, maxResults);
      } else if (this.bingApiKey) {
        return await this.searchWithBing(query, maxResults);
      } else {
        logger.warn("No web search API keys configured");
        return [];
      }
    } catch (error) {
      logger.error("Web search failed:", error);
      return [];
    }
  }

  async searchWithSerpAPI(query, maxResults = 3) {
    try {
      const response = await axios.get("https://serpapi.com/search", {
        params: {
          q: query,
          api_key: this.serpApiKey,
          engine: "google",
          num: maxResults,
        },
        timeout: 10000,
      });

      const results = response.data.organic_results || [];

      return results.slice(0, maxResults).map((result) => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link,
        source: "google",
      }));
    } catch (error) {
      logger.error("SerpAPI search error:", error);
      throw new Error("SerpAPI search failed");
    }
  }

  async searchWithBing(query, maxResults = 3) {
    try {
      const response = await axios.get(
        "https://api.bing.microsoft.com/v7.0/search",
        {
          params: {
            q: query,
            count: maxResults,
            responseFilter: "Webpages",
          },
          headers: {
            "Ocp-Apim-Subscription-Key": this.bingApiKey,
          },
          timeout: 10000,
        }
      );

      const results = response.data.webPages?.value || [];

      return results.slice(0, maxResults).map((result) => ({
        title: result.name,
        snippet: result.snippet,
        link: result.url,
        source: "bing",
      }));
    } catch (error) {
      logger.error("Bing search error:", error);
      throw new Error("Bing search failed");
    }
  }

  async getWebContext(query, maxResults = 3) {
    try {
      const searchResults = await this.searchWeb(query, maxResults);

      if (searchResults.length === 0) {
        return null;
      }

      const context = searchResults
        .map(
          (result, index) =>
            `[Web Result ${index + 1}] ${result.title}\n${
              result.snippet
            }\nSource: ${result.link}`
        )
        .join("\n\n");

      return {
        context,
        sources: searchResults,
      };
    } catch (error) {
      logger.error("Error getting web context:", error);
      return null;
    }
  }

  isWebSearchAvailable() {
    return !!(this.serpApiKey || this.bingApiKey);
  }

  formatSearchResults(results) {
    if (!results || results.length === 0) {
      return "No relevant web results found.";
    }

    return results
      .map(
        (result, index) =>
          `${index + 1}. **${result.title}**\n${result.snippet}\n[Read more](${
            result.link
          })`
      )
      .join("\n\n");
  }
}

module.exports = new SearchService();

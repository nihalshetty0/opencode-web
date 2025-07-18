import Opencode from "@opencode-ai/sdk"

// Create the Opencode client instance
export const opencodeClient = new Opencode({
  // The base URL for the opencode server (defaults to localhost:15096)
  baseURL: "http://localhost:15096/api",
  // Configure retries for better reliability
  maxRetries: 2,
})

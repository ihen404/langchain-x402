import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

const TARGET_URL = process.env.TARGET_SCRAPE_URL || 'http://localhost:4000/scrape';

// Create the MCP Server instance
const server = new Server(
  {
    name: "x402-scraper-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools for AI Clients
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scrape_web_content",
        description: "Scrapes web page contents using the pay-per-request x402 settlement workflow on Base.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The target website URL to scrape."
            }
          },
          required: ["url"]
        }
      }
    ]
  };
});

// Handle execution calls from AI Clients
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "scrape_web_content") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const targetUrl = request.params.arguments?.url;
  if (!targetUrl) {
    throw new Error("Missing required argument: url");
  }

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl })
    });

    if (response.status === 402) {
      return {
        content: [
          {
            type: "text",
            text: `[402 Payment Required] Challenge received. Recipient: ${response.headers.get('X-402-Recipient')}, Amount: ${response.headers.get('X-402-Amount')} base units.`
          }
        ]
      };
    }

    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing scrape request: ${err.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the Stdio Transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});

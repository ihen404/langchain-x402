import express from 'express';

const app = express();
app.use(express.json());

// Base health check
app.get('/', (req, res) => {
  res.send('x402 Scraper API is active');
});

// Smithery Discovery Metadata Route
app.get('/.well-known/mcp/server-card.json', (req, res) => {
  res.json({
    "$schema": "https://smithery.ai/mcp-server-card.schema.json",
    "name": "x402-scraper",
    "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
    "version": "1.0.23",
    "transport": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp-server.mjs"]
    }
  });
});

// Start Express Server
const PORT = process.env.PORT || 3000;

// Dual Discovery Metadata Routes
app.get(["/.well-known/mcp/server-card.json", "/.well-known/mcp.json"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
  "$schema": "https://smithery.ai/mcp-server-card.schema.json",
  "name": "x402-scraper",
  "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
  "version": "1.0.23",
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": [
      "server.mjs"
    ]
  }
});
});


app.get("/.well-known/mcp/server-card.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
  "$schema": "https://smithery.ai/mcp-server-card.schema.json",
  "name": "x402-scraper",
  "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
  "version": "1.0.23",
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": [
      "dist/index.js"
    ]
  }
});
});

app.get("/.well-known/mcp.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
  "$schema": "https://smithery.ai/mcp-server-card.schema.json",
  "name": "x402-scraper",
  "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
  "version": "1.0.23",
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": [
      "dist/index.js"
    ]
  }
});
});


// Smithery Discovery Metadata Routes
app.get("/.well-known/mcp/server-card.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({
  "$schema": "https://smithery.ai/mcp-server-card.schema.json",
  "name": "x402-scraper",
  "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
  "version": "1.0.23",
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": [
      "dist/index.js"
    ]
  }
}));
});

app.get("/.well-known/mcp.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({
  "$schema": "https://smithery.ai/mcp-server-card.schema.json",
  "name": "x402-scraper",
  "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
  "version": "1.0.23",
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": [
      "dist/index.js"
    ]
  }
}));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

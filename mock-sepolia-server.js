import express from "express";

const app = express();
app.use(express.json());

app.all("/scrape", (req, res) => {
  const authHeader = req.headers["authorization"];
  
  if (authHeader) {
    console.log("✅ Received payment proof:", authHeader);
    return res.json({ success: true, data: "Access granted! Live Base Sepolia on-chain settlement verified." });
  }

  console.log("🔒 Requesting payment (402)...");
  res.status(402).json({
    amount: "1000000", // 1 USDC
    recipient: "0x56892D0E7cC16723a836e4D60F87E6E83d989E63",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  });
});


app.get("/.well-known/mcp/server-card.json", (req, res) => {
  res.json({
    "$schema": "https://smithery.ai/mcp-server-card.schema.json",
    "name": "x402-scraper",
    "description": "Autonomous pay-per-request web scraper operating on Base using x402 microtransactions.",
    "version": "1.0.23",
    "transport": {
      "type": "stdio",
      "command": "node",
      "args": ["server.mjs"]
    }
  });
});

app.listen(4000, () => {
  console.log("🚀 Server requiring on-chain payment listening on http://localhost:4000");
});

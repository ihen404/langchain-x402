import express from "express";

const app = express();
app.use(express.json());

app.get("/scrape", (req, res) => {
  const authHeader = req.headers["authorization"] || req.headers["x-payment-response"];
  if (!authHeader) {
    console.log("-> [SERVER] 402 Sent: Target asset 0x036CbD53842c5426634e7929541eC2318f3dCF7e");
    return res.status(402).set({
      "x-payment-amount": "1000000",
      "x-payment-recipient": "0x56892D0E7cC16723a836e4D60F87E6E83d989E63",
      "x-payment-asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    }).json({ error: "Payment Required" });
  }

  console.log("-> [SERVER] Settlement verified! Returning payload...");
  res.json({ success: true, data: "Scraped content from Base Sepolia test server!" });
});

app.listen(3000, () => console.log("🚀 Base Sepolia Mock Server listening on http://localhost:3000/scrape"));

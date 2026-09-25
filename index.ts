import { x402ActionProvider } from './x402ActionProvider.js';

export { x402ActionProvider };

export class x402ScraperTool {
  name = 'x402_scraper';
  description = 'Pay-per-request web scraper agent with structured JSON output via x402 on Base.';

  async _call(input: { targetUrl: string }) {
    const response = await fetch(process.env.TARGET_SCRAPE_URL || 'http://localhost:4000/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    return await response.json();
  }
}

export class X402ScraperClient {
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.TARGET_SCRAPE_URL || 'http://localhost:4000/scrape';
  }

  async scrape(targetUrl: string) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl })
    });
    return await res.json();
  }
}

export default x402ScraperTool;

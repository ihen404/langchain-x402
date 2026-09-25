import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const RECIPIENT_ADDRESS = process.env.MAINNET_PAYMENT_RECIPIENT || '0x56892D0E7cC16723a836e4D60F87E6E83d989E63';
const USDC_ADDRESS = process.env.USDC_TOKEN_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '84532', 10);
const NETWORK_NAME = process.env.X402_NETWORK || 'base-sepolia';

// ==========================================
// STEP 1: x402 Machine Discovery Endpoint
// ==========================================
app.get('/.well-known/x402.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    name: 'X402 Scraper Service',
    description: 'Autonomous web scraper offering pay-per-request data extraction for AI agents.',
    version: '1.0.0',
    endpoints: [
      {
        path: '/scrape',
        method: 'POST',
        payment: {
          scheme: 'exact',
          network: NETWORK_NAME,
          caip2: `eip155:${CHAIN_ID}`,
          asset: USDC_ADDRESS,
          amount: '1000000', // 1.00 USDC in atomic units
          recipient: RECIPIENT_ADDRESS
        }
      }
    ]
  });
});

// ==========================================
// STEP 2: OpenAPI Spec with 402 Headers
// ==========================================
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'X402 Scraper API',
      description: 'Paywalled scraping endpoint compliant with HTTP 402 x402 specification.',
      version: '1.0.0'
    },
    paths: {
      '/scrape': {
        post: {
          summary: 'Scrape web target',
          description: 'Extracts web content. Triggers HTTP 402 Payment Required if valid payment header is missing.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    targetUrl: { type: 'string', example: 'https://example.com' }
                  },
                  required: ['targetUrl']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Scrape operation successful.'
            },
            '402': {
              description: 'Payment Required via x402 protocol.',
              headers: {
                'WWW-Authenticate': { schema: { type: 'string' } },
                'X-402-Recipient': { schema: { type: 'string' } },
                'X-402-Asset': { schema: { type: 'string' } },
                'X-402-Amount': { schema: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📍 Discovery metadata: http://localhost:${PORT}/.well-known/x402.json`);
  console.log(`📍 OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
});

import { getNextPendingUrl, updateQueueStatus, enqueueUrl } from './queue.js';
import { x402ScraperTool } from './index.js'; 

const SEED_URLS = [
  'https://docs.base.org',
  'https://docs.cdp.coinbase.com',
  'https://example.com'
];

async function processQueueItem() {
  const item = getNextPendingUrl();

  if (!item) {
    console.log('[Queue Worker] No pending items. Seeding default URLs...');
    SEED_URLS.forEach(url => enqueueUrl(url));
    return;
  }

  console.log(`[Queue Worker] Processing ID #${item.id}: ${item.url}`);
  updateQueueStatus(item.id, 'processing');

  try {
    const result = await x402ScraperTool.invoke({ url: item.url }); 
    if (result) {
      console.log(`[Queue Worker] ✅ Successfully processed #${item.id}:`, result);
      updateQueueStatus(item.id, 'completed');
    } else {
      throw new Error('Empty result received');
    }
  } catch (error) {
    console.error(`[Queue Worker] ❌ Failed to process #${item.id}:`, error.message);
    updateQueueStatus(item.id, 'failed');
  }
}

const INTERVAL_MS = 5 * 60 * 1000;
setInterval(processQueueItem, INTERVAL_MS);

processQueueItem();

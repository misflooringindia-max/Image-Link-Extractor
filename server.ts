import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractAjioProduct } from './src/server/extractor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Single product extraction
app.all('/api/extract', async (req, res) => {
  try {
    const url = (req.query.url as string) || req.body?.url;
    const sku = (req.query.sku as string) || req.body?.sku;

    if (!url) {
      return res.status(400).json({ success: false, error: 'Product URL is required' });
    }

    const data = await extractAjioProduct(url, sku);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Batch extraction
app.post('/api/extract-batch', async (req, res) => {
  try {
    const items: Array<{ sku?: string; url: string }> = req.body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of items required' });
    }

    // Limit batch size to 100 per request
    const batch = items.slice(0, 100);
    const results = [];

    // Process with concurrency of 4
    const concurrency = 4;
    for (let i = 0; i < batch.length; i += concurrency) {
      const chunk = batch.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((item) => extractAjioProduct(item.url, item.sku))
      );
      results.push(...chunkResults);
    }

    return res.json({ success: true, count: results.length, results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Batch extraction error' });
  }
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`AJIO Image Extractor server listening on port ${port}`);
});

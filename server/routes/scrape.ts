import { Router } from 'express';
import { userMiddleware } from '../middleware/user.js';
import { scrapeUrl } from '../services/jina.js';

const router = Router();

router.post('/', userMiddleware, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      res.status(400).json({ error: 'validation_error', message: 'URL is required' });
      return;
    }

    const text = await scrapeUrl(url.trim());
    res.json({ text });
  } catch (err: any) {
    console.error('URL scraping error:', err);
    res.status(502).json({
      error: 'scrape_error',
      message: err.message || 'Failed to scrape the provided URL',
    });
  }
});

export default router;

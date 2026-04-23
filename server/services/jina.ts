/**
 * Jina Reader API client for URL text extraction.
 * Uses the Jina Reader API to scrape and extract text content from URLs.
 */
export async function scrapeUrl(url: string): Promise<string> {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
      ...(process.env.JINA_API_KEY
        ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Jina Reader API error: ${response.status} ${response.statusText}`
    );
  }

  const text = await response.text();

  if (!text || text.trim().length === 0) {
    throw new Error('Jina Reader returned empty content for the provided URL');
  }

  return text.trim();
}

import fetch from 'node-fetch'; // Or any other HTTP client (axios, etc.)

export default async function handler(req, res) {
  const { imageUrl } = req.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS'); // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

  // Handle preflight request for OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', // Important to avoid being blocked
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Set correct content type
    res.setHeader('Content-Type', response.headers.get('content-type'));

    // Set Cache-Control headers for browser caching (optional but recommended)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year

    // Important: Stream the image data to the response
    response.body.pipe(res);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}

export const config = {
  api: {
    responseLimit: false, // Important for large images
  },
};

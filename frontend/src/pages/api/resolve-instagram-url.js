import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { shortcode } = req.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS'); // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

  // Handle preflight request for OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!shortcode) {
    return res.status(400).json({ error: 'Shortcode is required' });
  }

  try {
    const instagramUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;

    // Use GET request to resolve the redirect
    const response = await fetch(instagramUrl, {
      method: 'GET',
      redirect: 'manual', // Prevent automatic redirection
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36', // Standard browser UA
      },
    });

    if (response.status !== 301 && response.status !== 302) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    // Extract the final URL from the "location" header
    const resolvedUrl = response.headers.get('location');

    if (!resolvedUrl) {
      throw new Error('Failed to resolve redirected URL');
    }

    return res.status(200).json({ resolvedUrl });
  } catch (error) {
    console.error("Error resolving Instagram URL:", error);
    res.status(500).json({ error: 'Failed to resolve URL', details: error.message });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};

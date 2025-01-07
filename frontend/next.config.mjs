import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the parent `.env` file
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Load environment variables from the system
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose environment variables to the client
  env: {
    PUBLIC_BACKEND_URL_DEV: process.env.PUBLIC_BACKEND_URL_DEV,
    PORT: process.env.PORT || 3000 // Use the PORT environment variable if set, otherwise default to 3000
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Or 'http' if needed
        hostname: 'instagram.f*.fna.fbcdn.net', // The domain of your image
      },
      // {
      //   protocol: 'https',
      //   hostname: 'another-image-domain.net',
      // },
      // Add more domains as needed
    ]
  }
};

export default nextConfig;

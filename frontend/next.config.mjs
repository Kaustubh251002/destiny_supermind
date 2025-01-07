import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the parent `.env` file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose environment variables to the client
  env: {
    PUBLIC_BACKEND_URL_DEV: process.env.PUBLIC_BACKEND_URL_DEV,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Or 'http' if needed
        hostname: '*.fna.fbcdn.net', // The domain of your image
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

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
};

export default nextConfig;

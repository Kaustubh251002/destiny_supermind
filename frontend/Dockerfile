# Use a more specific node version
FROM node:23.5.0

# Install dependencies with legacy peer deps
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy only necessary files
COPY . . 

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production 

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1

# Expose the running port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
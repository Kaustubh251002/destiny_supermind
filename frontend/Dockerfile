# Use a more specific node version
FROM node:latest

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

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
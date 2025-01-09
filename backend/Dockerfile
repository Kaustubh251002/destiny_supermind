# Use a lightweight base image
FROM python:3.12-slim-bookworm

# Set environment variables to avoid interactive prompts during builds
ENV DEBIAN_FRONTEND=noninteractive \
    PATH="/root/.local/bin/:$PATH"

# Update and install necessary dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download the latest installer in a single step
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer and clean up
RUN sh /uv-installer.sh && rm /uv-installer.sh

# Upgrade pip in the same layer as uv installation to save space
RUN python -m pip install --no-cache-dir --upgrade pip

# Copy requirements first for better caching of dependencies
COPY requirements.txt .

# Use uv to install Python dependencies
RUN uv pip install --system --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 8000

# Use the uvicorn command as the default entry point
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

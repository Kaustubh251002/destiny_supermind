FROM python:3.12-slim-bookworm

# The installer requires curl (and certificates) to download the release archive
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates

# Download the latest installer
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer then remove it
RUN sh /uv-installer.sh && rm /uv-installer.sh

# Ensure the installed binary is on the `PATH`
ENV PATH="/root/.local/bin/:$PATH"
RUN uv tool install cowsay

WORKDIR /app

# Upgrade pip and install the uv package manager
RUN python -m pip install --upgrade pip 

# Use uv to install dependencies
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

COPY . .

RUN mv .env ..

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

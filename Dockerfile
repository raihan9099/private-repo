# ==============================
# GoatBot Dockerfile (Node 18)
# ==============================

# Base image
FROM node:18

# Maintainer info
LABEL maintainer="GoatBot Team <your-email@example.com>"

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose port (adjust if your bot uses different port)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]

# Optional tips:
# 1. Create a .dockerignore file:
#    node_modules
#    npm-debug.log
#    .DS_Store
#    .env
# 2. Build Docker image:
#    docker build -t goatbot-app .
# 3. Run container:
#    docker run -d -p 3000:3000 goatbot-app

# ==============================
# GoatBot Dockerfile (Full)
# ==============================

# Base image
FROM node:20

# Maintainer info
LABEL maintainer="GoatBot Team <your-email@example.com>"

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
# --legacy-peer-deps avoids peer dependency issues
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the port your app uses (if any, here 3000 as example)
EXPOSE 3000

# Optional: Set environment variables
# ENV NODE_ENV=production

# Start the app
CMD ["node", "index.js"]

# ==============================
# Optional tips:
# ==============================
# 1. Create a .dockerignore file to speed up builds:
#    node_modules
#    npm-debug.log
#    .DS_Store
#    .env
#
# 2. Build & run commands:
#    docker build -t goatbot-app .
#    docker run -d -p 3000:3000 goatbot-app
#
# 3. If you have other entry points, change CMD ["node", "index.js"] accordingly.
# 4. This setup fixes Node version mismatch and minimizes deprecated package warnings.

FROM node:20-alpine

WORKDIR /app

COPY package.json ./

# Install all dependencies in the image so local Node is optional.
RUN npm install

COPY tsconfig.json vitest.config.ts ./
COPY src ./src
COPY tests ./tests
COPY README.md ARCHITECTURE.md SETUP.md ./

EXPOSE 3000

CMD ["npm", "run", "dev"]

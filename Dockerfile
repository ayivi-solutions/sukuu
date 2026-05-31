FROM node:18-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "--require", "tsx/cjs", "apps/api/src/index.ts"]

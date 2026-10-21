FROM node:22.14.0-bookworm-slim
WORKDIR /app
COPY app.js ./server.js
EXPOSE 8080
USER node
CMD ["node", "server.js"]

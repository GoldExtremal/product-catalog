FROM node:20-alpine
WORKDIR /app
COPY . .
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=2s --retries=10 CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "server.js"]

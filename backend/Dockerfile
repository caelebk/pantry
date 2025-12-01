FROM denoland/deno:alpine

WORKDIR /app
COPY . .

# SERVER PORT
EXPOSE 8000

CMD ["run", "--allow-read", "--allow-write", "src/main.ts"]
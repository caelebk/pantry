FROM denoland/deno:2.5.6

WORKDIR /app

# Ensure data directory exists and is owned by deno user
RUN mkdir -p /app/data && chown -R deno:deno /app

USER deno

# Cache dependencies
COPY --chown=deno:deno deno.json .
COPY --chown=deno:deno deno.lock .
RUN deno cache deno.json

# Copy remaining project files
COPY --chown=deno:deno . .

# Pre-compile entrypoint
RUN deno cache main.ts

CMD ["task", "start"]

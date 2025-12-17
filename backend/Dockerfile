FROM denoland/deno:2.5.6

WORKDIR /app

# Prefer not to run as root.
USER deno

# Cache the dependencies as a layer (the following two steps are optional but recommended)
COPY deno.json .
COPY deno.lock .
RUN deno cache deno.json

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["task", "start"]

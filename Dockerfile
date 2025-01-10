# syntax = docker/dockerfile:1.4.0

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18
FROM node:${NODE_VERSION} as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq || apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

# Install node modules
COPY --link package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy application code
COPY --link . .

# Build application
RUN yarn run build

# Remove development dependencies
RUN yarn install --production=true


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 8080
CMD [ "yarn", "run", "start" ]

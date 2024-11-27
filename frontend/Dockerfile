# Use a lightweight Linux image with Bun
FROM oven/bun:latest as build

# Set the working directory
WORKDIR /usr/src/xams/frontend

# Copy the package and lock files to the working directory
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the Next.js project
RUN bun next build

# Use a lightweight environment for running the application
FROM oven/bun:latest as runner

# Set the working directory
WORKDIR /usr/src/xams/frontend

ENV PORT=8080

# Copy the built files and dependencies from the build stage
COPY --from=build /usr/src/xams/frontend/.next ./.next
COPY --from=build /usr/src/xams/frontend/node_modules ./node_modules
COPY --from=build /usr/src/xams/frontend/package.json ./package.json

# Expose the port the app will run on
EXPOSE 8080

# Run the application using Bun
CMD ["sh", "-c", "bun next start --port ${PORT}"]

FROM oven/bun:latest as build
WORKDIR /usr/src/xams/frontend
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
RUN bun next build

FROM oven/bun:latest as runner
WORKDIR /usr/src/xams/frontend
ENV PORT=8080
COPY --from=build /usr/src/xams/frontend/.next ./.next
COPY --from=build /usr/src/xams/frontend/node_modules ./node_modules
COPY --from=build /usr/src/xams/frontend/package.json ./package.json
EXPOSE 8080

CMD ["sh", "-c", "bun next start --port ${PORT}"]

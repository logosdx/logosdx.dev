FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json .
COPY src src

RUN corepack enable
RUN pnpm install
RUN pnpm client
RUN pnpm prune --prod
RUN rm -rf src/client

ENV NODE_ENV=production
ENV APP_LOG_STRIP_STACK=false
ENV APP_URL=https://logosdx.dev
ENV APP_PORT=4000

EXPOSE 4000

CMD ["pnpm", "start"]
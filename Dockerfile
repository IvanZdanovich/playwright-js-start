# The image tag must equal the @playwright/test version in package.json, or the bundled browsers do not match.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /e2e

ARG TARGET_ENV=dev
ARG LANGUAGE=en
ARG COLOUR_THEME=default
ARG PARALLEL_STREAMS=3
ARG BROWSER=chromium

# CI=true skips the git hook install, turns on retries, and forbids test.only.
ENV CI=true \
    TARGET_ENV=${TARGET_ENV} \
    LANGUAGE=${LANGUAGE} \
    COLOUR_THEME=${COLOUR_THEME} \
    PARALLEL_STREAMS=${PARALLEL_STREAMS} \
    BROWSER=${BROWSER}

COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm ci

COPY . .

# Mount playwright/sensitive-data and reports/ at run time; the image carries no credentials.
CMD ["npm", "run", "test:parallel"]

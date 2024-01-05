# Build Stage 1

FROM node:18 as appbuild

WORKDIR /app
COPY package.json ./
RUN npm install
RUN npm install tsx
COPY ./src ./src
RUN npx build

# Build Stage 2

FROM node:18
WORKDIR /app
COPY package.json ./
RUN npm install
COPY --from=appbuild /app ./dist
CMD 
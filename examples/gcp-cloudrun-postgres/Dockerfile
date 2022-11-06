FROM node
WORKDIR /usr
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build

## this is stage two , where the app actually runs
FROM node
WORKDIR /usr
COPY package.json ./
RUN npm install --only=production --ignore-scripts
COPY --from=0 /usr/build ./build
RUN ls -A
EXPOSE 8080
CMD ["npm", "run", "start"]

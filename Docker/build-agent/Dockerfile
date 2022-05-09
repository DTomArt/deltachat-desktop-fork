FROM node:latest
RUN apt-get update
RUN git clone https://github.com/DTomArt/deltachat-desktop-fork.git
WORKDIR ./deltachat-desktop-fork
RUN npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000
RUN npm i && npm run build
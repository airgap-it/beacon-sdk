FROM node:16

RUN apt-get update && apt-get install -yq git python build-essential

# create app directory
RUN mkdir /app
WORKDIR /app

# Bundle app source
COPY . /app

# install dependencies
RUN npm install

RUN chmod +x ./npm-ci-publish-beta-only.sh
RUN chmod +x ./npm-ci-publish.sh

# set to production
RUN export NODE_ENV=production

# build
RUN npm run build

CMD ["npm", "run", "test"]

FROM node:18

# Install dependencies with Python 3
RUN apt-get update && apt-get install -yq git python3 build-essential python-is-python3

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .

# Install ALL dependencies including devDependencies
RUN npm ci --include=dev

# Set production environment after installing dependencies
ENV NODE_ENV=production

# Make scripts executable
RUN chmod +x ./npm-ci-publish-beta-only.sh ./npm-ci-publish.sh

CMD ["npm", "run", "test"]
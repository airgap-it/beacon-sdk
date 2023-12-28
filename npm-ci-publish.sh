#!/bin/bash
echo "//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > .npmrc

git update-index --assume-unchanged npm-ci-publish.sh
git update-index --assume-unchanged npm-ci-publish-beta-only.sh

VERSION=$(node -pe 'JSON.parse(process.argv[1]).version.indexOf("beta")' "$(cat lerna.json)")

if [ "$VERSION" = "-1" ]
then
  npx lerna publish from-package --contents ./ --yes
  # lerna exec -- "npm publish || exit 0" # If some packages fail to be published, this command ignores already published ones and publishes the missing ones
else
  echo "version is beta, using --tag next"
  npx lerna publish from-package --contents ./ --dist-tag next --yes
fi

rm .npmrc
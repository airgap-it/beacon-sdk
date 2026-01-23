#!/bin/bash
echo "//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > .npmrc

git update-index --assume-unchanged npm-ci-publish.sh
git update-index --assume-unchanged npm-ci-publish-prerelease.sh

VERSION=$(node -pe 'const v = JSON.parse(process.argv[1]).version; v.includes("alpha") || v.includes("beta")' "$(cat lerna.json)")

if [ "$VERSION" = "false" ]
then
  echo "cannot publish non-prerelease version (must contain 'alpha' or 'beta')"
else
  echo "version is prerelease (alpha or beta), using --tag next"
  npx lerna publish from-package --contents ./ --dist-tag next --yes
fi

rm .npmrc
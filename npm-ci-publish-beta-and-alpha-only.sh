#!/bin/bash
echo "//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > .npmrc

git update-index --assume-unchanged npm-ci-publish.sh
git update-index --assume-unchanged npm-ci-publish-beta-and-alpha-only.sh

VERSION=$(node -pe 'const version = JSON.parse(process.argv[1]).version; version.includes("beta") || version.includes("alpha") ? version : ""' "$(cat lerna.json)")

if [ -z "$VERSION" ]
then
  echo "cannot publish non-beta/non-alpha version"
else
  if [[ "$VERSION" == *"beta"* ]]
  then
    TAG="next"
    echo "version is beta, using --tag $TAG"
  elif [[ "$VERSION" == *"alpha"* ]]
  then
    TAG="alpha"
    echo "version is alpha, using --tag $TAG"
  fi
  npx lerna publish from-package --contents ./ --dist-tag $TAG --yes
fi

rm .npmrc

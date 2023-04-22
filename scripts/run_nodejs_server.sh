#!/bin/sh

docker run -it --rm \
    --name prompt-translate-env \
    --entrypoint /bin/sh \
    --mount type=bind,source=$(cd ../ && pwd),target=/prompt-translate-chrome-extension \
    node:lts-alpine3.17 \
    -c 'cd /prompt-translate-chrome-extension && npm run watch'


# chrome-extension-cli build system
# https://www.npmjs.com/package/chrome-extension-cli

# steps:
# npm install -g chrome-extension-cli
# chrome-extension-cli my-extension
# cd my-extension
# npm run watch

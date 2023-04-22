#!/bin/sh

docker run -it --rm \
    --name prompt-translate-env \
    --entrypoint /bin/sh \
    --mount type=bind,source=$(cd ../ && pwd),target=/prompt-translate-chrome-extension \
    node:lts-alpine3.17 \
    -c 'cd /prompt-translate-chrome-extension && /bin/sh'



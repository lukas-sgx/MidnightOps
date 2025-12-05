#!/bin/bash

docker cp ../backend/src midnightops_backend:/usr/src/app/
docker cp ../backend/package.json midnightops_backend:/usr/src/app/
docker cp ../backend/tsconfig.json midnightops_backend:/usr/src/app/
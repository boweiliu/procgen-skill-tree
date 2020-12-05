#!/bin/bash

nvm install 12
nvm use 12
npm install -g ts-node
ts-node --project tsconfig.json assets_builder.ts ../../game/config.json 

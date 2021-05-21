#!/bin/bash

# navigate to git repo destination
cd ./discordwebhook-dailyukcovid

# run the index.js with node installer.
# -
# if you use nvm and have set up CRON as root (naughty),
# you will need to change 'node' (below) to full path of node runtime.
# you can do this with "which node" on normal user account
node index.js
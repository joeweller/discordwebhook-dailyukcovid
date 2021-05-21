# discordwebhook-dailyukcovid

## About
A simple discord bot controller that posts messages to the discord webhook api. It is soley designed to run on CRON once a day to poll the gov.uk COVID data api and post daily positive COVID test metric.

## Getting started

   1) pull this repo
   2) navigate to repo folder
   3) install dependencies: `$ npm i`
   4) copy "config.json.template" and rename to "config.json": `$ cp config.json.template config.json`
      1) edit "config.json" and set your discord's webhook URL
   5) inspect "run.sh" using editor or cat and ascertain if it needs editing.
      1) if it needs to be altered: `cp run.sh customrun.sh`
   6) enable "run.sh" to be executed: `chmod +x run.sh`
   7) set up CRON to run script: `0 16 * * * /home/discordwebhook-dailyukcovid/run.sh`

instead of CRON you can simply run `$ ./run.sh` to test if it's working

### info
CRON here is set to check the API at 4pm daily. This is generally when the daily figures are updated.

It is sometimes updated later then this; the code will retry every 10 minutes for a maximum of 2 hours (12 times) incase there is delay. After 12 retries and still no valid response, the service will 'give up' and exit with 1.

Runtime logs are generated within the repo folder in a file called `app.log`. This will be created at first run and will continue to log thereafter. To see latest logs, use "tail".

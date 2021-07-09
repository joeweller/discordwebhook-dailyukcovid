const helpers = require('./helpers');
const { readFileSync } = require('fs');

var CONFIG;

const COVIDQUERY = 'structure={"date":"date","newCasesByPublishDate":"newCasesByPublishDate","newDeaths28DaysByPublishDate":"newDeaths28DaysByPublishDate"}&filters=areaType=overview;date=' + helpers.makeApiDate();
const COVIDURL = "https://api.coronavirus.data.gov.uk/v1/data?" + COVIDQUERY;


try {
    CONFIG = JSON.parse(readFileSync('./config.json'))
} catch (ex) {
    console.log(`config file failed with : ${ex.message}`)
    process.exit(1)
}

(async function() {
    helpers.logger('started!')
    console.log(COVIDURL);
    var covidResult;

    // try for 2 hours with 10 minute intervals (12 times)
    for (let i = 0; i < 16; i++) {
        let result = await helpers.makeCallout(
            COVIDURL,
            { port: 443, method: 'GET', headers: { "Content-Type": "application/json; charset=utf-8" } },
            null
        )
        if (200 === result.statusCode) {
            covidResult = JSON.parse(result.body)
            helpers.logger(`COVID Response: ${result.statusCode}, OK`)
            break
        } else {
            helpers.logger(`COVID Response: ${result.statusCode}, waiting 15 minutes`)
            await helpers.sleepPromise('m', 15);
        }
    }
    
    if (!covidResult) {
        helpers.logger(`unable to retrieve COVID result, exiting`)
        process.exit(1);
    }
    // console.log(covidResult.data)
    // console.log(covidResult.data[0].date)
    // console.log(covidResult.data[0].newCasesByPublishDate)
    // console.log(covidResult.data[0].newDeaths28DaysByPublishDate)

    const discordMessage = `Date: **${covidResult.data[0].date}**\nNew cases: **${covidResult.data[0].newCasesByPublishDate}**\nNew deaths: **${covidResult.data[0].newDeaths28DaysByPublishDate}**`
    helpers.logger(`discord message: "${discordMessage}"`)

    const discordResult = await helpers.makeCallout(
        CONFIG.discordUrl,
        { port: 443, method: 'POST', headers: { "Content-Type": "application/json" } },
        await helpers.makeDiscordBody(discordMessage)
    )

    if (204 === discordResult.statusCode) {
        helpers.logger(`discord response: ${discordResult.statusCode}, OK`)
    } else {
        helpers.logger(`discord response: ${discordResult.statusCode}, something might be wrong`)
    }
    helpers.logger('ended!\n')
})()

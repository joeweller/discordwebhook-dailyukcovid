const helpers = require('./helpers');
const { readFileSync } = require('fs');

var CONFIG;
const COVIDURL = `https://api.coronavirus.data.gov.uk/v1/data?structure=%7B%22date%22%3A%22date%22,%22areaName%22%3A%22areaName%22,%22areaCode%22%3A%22areaCode%22,%22newCasesByPublishDate%22%3A%22newCasesByPublishDate%22,%22cumCasesByPublishDate%22%3A%22cumCasesByPublishDate%22,%22cumDeaths28DaysByPublishDate%22%3A%22cumDeaths28DaysByPublishDate%22,%22cumDeathsByDeathDate%22%3A%22cumDeathsByDeathDate%22%7D&filters=areaType%3Doverview%3Bdate%3D${helpers.makeApiDate()}`

try {
    CONFIG = JSON.parse(readFileSync('./config.json'))
} catch (ex) {
    console.log(`config file failed with : ${ex.message}`)
    process.exit(1)
}

(async function() {
    helpers.logger('started!')
    
    var covidResult;

    // try for 2 hours with 10 minute intervals (12 times)
    for (let i = 0; i < 16; i++) {
        let result = await helpers.makeCallout(
            COVIDURL,
            { port: 443, method: 'GET', headers: { "Content-Type": "application/json; charset=utf-8" } },
            null
        )
        if (200 === result.statusCode) {
            covidResult = result.body
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
    
    const discordMessage = `New cases: ${(JSON.parse(covidResult)).data[0].newCasesByPublishDate}`
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

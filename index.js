const helpers = require('./helpers');
const { readFileSync } = require('fs');
const url = require('url');


var CONFIG;

try {
    CONFIG = JSON.parse(readFileSync('./config.json'))
} catch (ex) {
    console.log(`config file failed with : ${ex.message}`)
    process.exit(1)
}

(async function() {

    helpers.consoleLog('started!')

    var covidResult;

    const covidOptions = {
        hostname: 'api.coronavirus.data.gov.uk',
        path: `/v1/data?structure=%7B%22date%22%3A%22date%22,%22areaName%22%3A%22areaName%22,%22areaCode%22%3A%22areaCode%22,%22newCasesByPublishDate%22%3A%22newCasesByPublishDate%22,%22cumCasesByPublishDate%22%3A%22cumCasesByPublishDate%22,%22cumDeaths28DaysByPublishDate%22%3A%22cumDeaths28DaysByPublishDate%22,%22cumDeathsByDeathDate%22%3A%22cumDeathsByDeathDate%22%7D&filters=areaType%3Doverview%3Bdate%3D${helpers.makeApiDate()}`,
        port: 443,
        method: 'GET',
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        }
    }

    // try for 2 hours wiht 10 minute intervals (12 times)
    for (let i = 0; i < 12; i++) {
        let result = await helpers.fetchRequest(covidOptions, null)
        if (200 === result.response.statusCode) {
            covidResult = result.body
            helpers.consoleLog(`COVID Response: ${result.response.statusCode}, OK`)
            break
        } else {
            helpers.consoleLog(`COVID Response: ${result.response.statusCode}, waiting 10 minutes`)
            await helpers.waitMinutes(10);
        }
    }
    
    if (!covidResult) {
        helpers.consoleLog(`unable to retrieve COVID result, exiting`)
        process.exit(1);
    } else {
        covidResult = JSON.parse(covidResult)
    }

    const discordUrl = new url.URL(CONFIG.discordUrl)
    const discordOptions = {
        hostname: discordUrl.hostname,
        path: discordUrl.pathname,
        port: 443,
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        }
    }
    const discordMessage = `New cases: ${covidResult.data[0].newCasesByPublishDate}`
    helpers.consoleLog(`discord message: "${discordMessage}"`)

    const discordResult = await helpers.sendDiscordWebhook(discordOptions, discordMessage)
    if (204 === discordResult.response.statusCode) {
        helpers.consoleLog(`discord response: ${discordResult.response.statusCode}, OK`)
    } else {
        helpers.consoleLog(`discord response: ${discordResult.response.statusCode}, something might be wrong`)
    }

    helpers.consoleLog('ended!')

})()

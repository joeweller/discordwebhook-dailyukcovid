const https = require('https');
const zlib = require('zlib');
const fs = require('fs');


const makeApiDate = function() {
    const normaliseString = function(n) {
        let result = (n).toString()
        if (1 === result.length) {
            result = `0${result}`
        }
        return result
    }

    const d = new Date(Date.now());
    
    return `${d.getFullYear()}-${normaliseString(d.getMonth() + 1)}-${normaliseString(d.getDate())}`
}

const sleepPromise = async function(timeType, timeValue) {
    const timeModifier = { 'ms': null, 's': 1000, 'm': 60, 'h': 60 }
    const timeTypes = ['ms', 's', 'm', 'h']

    for (let i = 1; i < timeTypes.length; i++) {
        let key = timeTypes[i]
        timeValue = timeValue * timeModifier[key]
        if (timeType === key) {
            break;
        }
    }

    return new Promise(
        (resolve, reject) => {
            if (!timeType || 'string' !== typeof timeType || !timeTypes.includes(timeType)) {
                reject(`timeType accepted values: ${timeTypes.toString()}`)
            } else if (!(timeValue >= 0) || 'number' !== typeof timeValue) {
                reject('timeValue must be positive number and not NULL')
            } else {
                setTimeout(resolve, timeValue)
            } 
        }
    )
}

const makeDiscordBody = async function(message) {
    return new Promise((resolve) => {
        resolve(JSON.stringify({ content: message.substring(0, 2000) }))
    })
}

const makeCallout = async function(urlString, options, payload) {

    const gzipDecompress = async function(buffer) {
        return new Promise((resolve, reject) => {
            zlib.unzip(buffer, async (err, buffer) => {
                if (!err) {
                    resolve(buffer.toString())
                } else {
                    reject(err)
                }
            })
        })
    }

    return new Promise((resolve, reject) => {
        const req = https.request(urlString, options, (res) => {
            const chunks = [ ];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            })
            
            res.on('error', (err) => {
                reject(`callout error: ${err}`);
            })
            
            res.on('end', async () => {
                let body;
                if (res.headers["content-encoding"] && "gzip" === res.headers["content-encoding"]) {
                    body = await gzipDecompress(Buffer.concat(chunks))
                } else {
                    body = Buffer.concat(chunks).toString()
                }

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(`callout statuscode: ${res.statusCode}. body: ${body}`);
                } else {
                    let result = res;
                    if (body) {
                        result["body"] = body;
                    }
                    resolve(result);
                };
            });
        });
        
        req.on('error', (err) => {
            reject(`callout error: ${err}`);
        });

        if ("POST" === options.method) {
            if (payload) {
                req.write(payload)
            } else {
                req.write()
            }
        }
        
        req.end();
    });
}

const logger = function(message) {
    const entry = `${new Date()} - ${message}`
    console.log(entry)
    fs.appendFileSync('./app.log', entry + '\n')
}

module.exports = {
    sleepPromise,
    logger,
    makeApiDate,
    makeCallout,
    makeDiscordBody
};

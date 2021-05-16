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

const waitMinutes = async function(m) {
    return waitSeconds(m * 60)
}

const waitSeconds = async function(s) {
    return waitMilliSeconds(s * 1000);
}

const waitMilliSeconds = async function(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    )
}

const gzipDecompress = async function(buffer) {
    return new Promise((resolve, reject) => {
        zlib.unzip(buffer, async (err, buffer) => {
            
            if (!err) {
                resolve(buffer.toString())
            } else {
                reject(err)
            }
        });
    })
}

const fetchRequest = async function(options, payload) {
    return new Promise((resolve, reject) => {
        const req = https.request(
            options, (res) => {
                
                const chunks = [ ];
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                res.on('error', (err) => {
                    reject(`Request callout error: ${err}`);
                });
                
                res.on('end', async () => {

                    var body;

                    if (res.headers["content-encoding"] && res.headers["content-encoding"] === "gzip") {
                        body = await gzipDecompress(Buffer.concat(chunks))
                    } else {
                        body = Buffer.concat(chunks).toString()
                    }

                    if (res.statusCode > 200 && res.statusCode >= 300) {
                        reject(`Callout statuscode: ${res.statuscode}. body: ${body}`);
                    } else {
                        resolve({"response": res, "body": body});
                    };
                });
            }
        );
        
        req.on('error', (err) => {
            reject(`Request callout error: ${err}`);
        });

        if ("post" === options.method) {

            if (payload) { req.write(payload) }
            else { req.write() }
        }
        
        req.end();
    });
}


const sendDiscordWebhook = async function(options, message) {
    return new Promise((resolve, reject) => {

        const req = https.request(
            options, (res) => {
                
                const chunks = [ ];

                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                res.on('error', (err) => {
                    reject(`Discord response callout error: ${err}`);
                });
                
                res.on('end', () => {
                    if (res.statusCode > 200 && res.statusCode >= 300) {
                        reject(`Discord callout statuscode: ${res.statuscode}. body: ${Buffer.concat(chunks).toString()}`);
                    } else {
                        resolve({"response": res});
                    };
                });
            }
        );

        req.on('error', (err) => {
            reject(`Discord request callout error: ${err}`);
        });

        req.write(JSON.stringify({content: message.substring(0, 2000)}));
        req.end();
    });
};

const consoleLog = function(message) {
    const entry = `${new Date()} - ${message}`
    console.log(entry)
    fs.appendFileSync('./app.log', entry + '\n')
}

module.exports = {
    consoleLog,
    fetchRequest,
    waitMinutes,
    sendDiscordWebhook,
    makeApiDate
};

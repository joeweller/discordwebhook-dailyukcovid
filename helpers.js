const https = require('https');

exports = {
    getRequest
};

const makeDiscordOptions = function(url) {

}

const getRequest = async function(options, payload) {
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
                
                res.on('end', () => {
                    console.log(`statuscode: ${res.statusCode}`);
                    const responseBody = Buffer.concat(chunks).toString();
                    if (res.statusCode > 200 && res.statusCode >= 300) {
                        reject(`Callout statuscode: ${res.statuscode}. body: ${responseBody}`);
                    } else {
                        resolve({"response": res, "body": responseBody});
                    };
                });
            }
        );
        
        req.on('error', (err) => {
            reject(`Request callout error: ${err}`);
        });

        if (payload) { req.write(payload) }
        else { req.write() }

        req.end();
    });
}
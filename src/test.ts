const request = require('request')
const https = require('https')

// get
async function getBlock(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Host': 'www.pdflibr.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
            },
            url,
        }
        request(options, (err, response, body) => {
            if (err) {
                reject(err)
            }
            if (response && response.statusCode === 200) {
                console.log(body)
                const info = JSON.parse(JSON.stringify(body))
                console.log(info)
                resolve(info)
            }
            console.log(body)
        })
    })
}

async function main() {
    await getBlock('https://www.pdflibr.com/')
}

main().catch((err) => {
    console.log(err)
})

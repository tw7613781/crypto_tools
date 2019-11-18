import * as request from 'request'

export class Bitcoke {

    // symbol can be BTCUSD, ETHUSD, EOSUSD
    public async getPrice(symbol: string): Promise<number> {
        return new Promise( (resolve, reject) => {
            const baseUrl = 'http://api.bitcoke.com/api/index/price'
            const queryString = `?symbols=${symbol}`
            const options = {
                uri: baseUrl + queryString,
            }
            request.get(options, (err, res, body) => {
                if (err) {
                    reject(err)
                } else {
                    const ret = JSON.parse(body)
                    resolve(ret.result[0].value)
                }
            })
        })
    }
}

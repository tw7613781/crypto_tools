import * as request from 'request-promise-native';

export class Bitcoke {

    // symbol can be BTCUSD, ETHUSD, EOSUSD
    public async getPrice(symbol: string) {
        const baseUrl = 'http://api.bitcoke.com/api/index/price';
        const queryString = `?symbols=${symbol}`;
        const options = {
            uri: baseUrl + queryString,
        };
        try {
            let ret = await request.get(options);
            ret = JSON.parse(ret);
            return ret.result[0].value;
        } catch (err) {
            throw err;
        }
    }
}

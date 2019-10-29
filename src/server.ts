import * as bodyParser from 'body-parser';
import express from 'express';
import { Bitcoke } from './bitcoke';
import { ErrorHandler } from './errorHandler';

const app = express();
const simpleToken = 'daxiang';
const bitcoke = new Bitcoke();

app.use(bodyParser.json());

app.use((req, res, next) => {
    const { password } = req.headers;
    if (password !== simpleToken) {
        return ErrorHandler.unauthorized(res);
    }
    next ();
})

// -X POST server:port/stop-loss \
// -H 'Content-Type: application/json' \
// -H 'Password': 'daxiang' \
// -d '{
//      "amount": 200,
//      "buyPrice": 9670,
//      "loss": -0.02
//      "symbol": "ETHUSD"
// -----------------------
// Supported symbol, "ETHUSD", "BTCUSD", "EOSUSD"
app.post('/stop-loss', async (req, res) => {
    const {symbol, amount, buyPrice, loss} = req.body;
    if (amount === undefined || buyPrice === undefined || loss === undefined) {
        return ErrorHandler.invalidParam(res);
    }
    const symbols = ['BTCUSD', 'ETHUSD', 'EOSUSD'];
    if (!symbols.includes(symbol)) {
        return ErrorHandler.invalidParam(res);
    }
    try {
        const price = await bitcoke.getPrice(symbol);
        const stopLossPrice = (price * loss) / (amount / buyPrice) + buyPrice;
        return res.json({stopLossPrice});
    } catch (err) {
        console.log(`Error getting Price from Bitcoke: ${err}`);
        return ErrorHandler.serviceError(res);
    }
});

app.listen(3000, () => console.log('Server listening on port 3000!'));

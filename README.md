# crypto_tools

an API server provide some utilities for crypto trade

## Simple Auth

Putting a predefined password in the header to make a simple auth.

## Calculate stop-loss 

Supported symbol, "ETHUSD", "BTCUSD", "EOSUSD"

In bitcoke, you can use any of above currencies as principal to trade. So the loss and symbol together means the amount of money that you can tolerate to loss. Based on the tolerant loss, we can calculate the stop loss price.

```shell
curl -X POST 52.78.92.80:3000/stop-loss \
-H 'Content-Type: application/json' \
-H 'Password: daxiang' \
-d '{
     "amount": 200,
     "buyPrice": 9670,
     "loss": -0.02,
     "symbol": "ETHUSD"
     }'
```

## Calculate loss or win

```shell
-X POST server:port/loss \
-H 'Content-Type: application/json' \
-H 'Password': 'daxiang' \
-d '{
     "amount": 200,
     "buyPrice": 9670,
     "sellPrice": 9900,
     "symbol": "ETHUSD"
```

## Demo server

http://13.209.22.173:3000
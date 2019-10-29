# crypto_tools

an API server provide some utilities for crypto trade

## Calculate stop-loss 

```shell
curl -X POST server:port/stop-loss \
-H 'Content-Type: application/json' \
-d '{
     "password": "",
     "amount": 200,
     "buyPrice": 9670,
     "loss": -0.02
     "symbol": "ETHUSD"
-----------------------
Supported symbol, "ETHUSD", "BTCUSD", "EOSUSD"
```
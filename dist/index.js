"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const ApiKey = 'V7HC4o9Ddk5xIua2FPoMMkc8knLJJcLpXSWOUa4Ny6AOeOMZdfdocINBFALNlvJ8';
const ApiSecret = 'vUXHJEW1JZzax5vVhdaLyfU8WG5zyXAGR8ujD9gQbMsr1OT790x4u7nBtGJgdShx';
const client = new bot_1.Bot({ apiKey: ApiKey, apiSecret: ApiSecret });
client.configure({
    coin: 'ADAUSDT',
    scalping: true,
    amount: 20,
    test: true,
    repeat: true,
    limits: { Profit: 0.03, Loss: 0.01 }
});
client.subscribe();
//# sourceMappingURL=index.js.map
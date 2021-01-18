"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const ApiKey = '';
const ApiSecret = '';
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
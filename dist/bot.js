"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const binance_api_node_1 = __importDefault(require("binance-api-node"));
const tools_1 = require("./tools");
const fs = __importStar(require("fs"));
const technicalindicators_1 = require("technicalindicators");
class Bot {
    constructor(keys = { apiKey: 'API-KEY', apiSecret: 'API-KEY' }) {
        this.keys = keys;
        this.tradeId = 0;
        this.client = null;
        this.startPrice = 0;
        this.coin = "BTCUSDT";
        this.amount = 0;
        this.qty = 0;
        this.repeat = false;
        this.action = tools_1.Action.Buy;
        this.candlePeriod = "15m";
        this.rules = { Qty: 0, Price: 0 };
        this.limits = { Profit: 0.5, Loss: 0.02 };
        this.conditions = { stopLoss: 0, stopProfit: 0 };
        this.logger = new tools_1.Logger();
        this.bought = false;
        this.scalping = false;
        this.test = true;
        this.sma = [];
        this.rsi = [];
        this.values = [];
        this.client = binance_api_node_1.default(keys);
        this.logFile = `../logs/${Date.now()}.txt`;
        fs.writeFile(this.logFile, '', () => {
            console.log('Creating log file ...');
        });
        this.getRules();
    }
    getRules() {
        return __awaiter(this, void 0, void 0, function* () {
            const rules = yield this.client.exchangeInfo();
            rules.symbols.forEach((symbol) => {
                if (symbol.symbol == this.coin) {
                    this.rules = { Qty: tools_1.min_Qty(symbol.filters[2].minQty), Price: tools_1.min_Price(symbol.filters[0].minPrice) };
                }
            });
        });
    }
    setOrder(operation, orderPrice, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = `Order to ${operation} ${this.coin} has been set at price ${orderPrice}`;
            try {
                this.logger.log({ message: message, warning: '- Attempt' });
                this.action = tools_1.Action.Pending;
                const options = {
                    symbol: this.coin,
                    side: operation,
                    quantity: this.qty,
                    price: orderPrice,
                };
                if (this.test)
                    yield this.client.orderTest(options);
                else
                    yield this.client.order(options);
                callback();
                this.logger.log({ message: message, success: '- Complete' });
            }
            catch (e) {
                this.logger.log({ message: message, error: `- Failed: ${e.message}` });
                this.action = operation == 'SELL' ? tools_1.Action.Sell : tools_1.Action.Buy;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.scalping) {
                this.action = tools_1.Action.Stop;
                this.calculatePrice();
            }
            this.client.ws.ticker(this.coin, (candle) => {
                let price = Number.parseFloat(candle.curDayClose);
                console.clear();
                this.logger.console({ message: 'TradeId:', warning: this.tradeId.toString() });
                this.logger.console({ message: `Price at`, success: price.toString() });
                this.logger.console({ message: 'Status:', warning: this.action });
                this.logProfit(price);
                switch (this.action) {
                    case tools_1.Action.Buy:
                        this.buy(price);
                        break;
                    case tools_1.Action.Sell:
                        this.sell(price);
                        break;
                    case tools_1.Action.Waiting:
                        this.waiting(price);
                        break;
                }
                console.log('AVG :', this.sma[this.sma.length - 1]);
                console.log('RSI :', this.rsi[this.rsi.length - 1]);
                console.log('Conditions :', this.conditions);
                console.log('------');
                console.log(this.logger.logs);
            });
        });
    }
    sell(price) {
        if (price >= this.conditions.stopProfit || price <= this.conditions.stopLoss) {
            this.setOrder(tools_1.Operation.Sell, price, () => {
                this.logger.log({ message: `Selling at`, info: price.toString() });
                this.action = tools_1.Action.Waiting;
            });
        }
    }
    buy(price) {
        this.qty = Number.parseFloat((this.amount / price).toFixed(this.rules.Qty));
        const callBack = () => {
            this.logger.log({ message: `Buying at`, info: price.toString() });
            this.updateLimits(price);
            this.action = tools_1.Action.Waiting;
        };
        if (this.scalping) {
            if (this.rsi[this.rsi.length - 1] < 20) {
                this.setOrder(tools_1.Operation.Buy, price, callBack);
            }
        }
        else {
            this.setOrder(tools_1.Operation.Buy, price, callBack);
        }
    }
    waiting(price) {
        if ((price >= this.startPrice) && !this.bought) {
            this.logger.log({ success: `Bought at ${price.toString()}` });
            this.startPrice = price;
            this.action = tools_1.Action.Sell;
            this.bought = true;
        }
        else if ((price >= this.conditions.stopProfit || price <= this.conditions.stopLoss) && this.bought) {
            this.logger.log({ success: `Sold at ${price.toString()}` });
            this.action = this.repeat ? tools_1.Action.Buy : tools_1.Action.Stop;
            fs.appendFile(this.logFile, tools_1.Profit(price, this.startPrice).toFixed(3) + "\n", () => { });
            this.bought = false;
            this.logger.logs = "";
            this.tradeId++;
            console.clear();
        }
    }
    calculatePrice() {
        this.client.ws.candles(this.coin, this.candlePeriod, (candle) => {
            this.values.push(Number.parseFloat(candle.close));
            this.sma = technicalindicators_1.SMA.calculate({ period: 15, values: this.values });
            this.rsi = technicalindicators_1.RSI.calculate({ period: 15, values: this.values });
        });
        setTimeout(() => this.action = tools_1.Action.Buy, 5 * 60 * 1000);
    }
    configure(options) {
        this.limits = options.limits;
        this.amount = options.amount;
        this.coin = options.coin;
        this.test = options.test;
        this.scalping = options.scalping;
        this.repeat = options.repeat;
    }
    updateLimits(startPrice) {
        this.conditions = {
            stopLoss: Number.parseFloat((startPrice - (startPrice * this.limits.Loss)).toFixed(this.rules.Price)),
            stopProfit: Number.parseFloat((startPrice * (this.limits.Profit + 1)).toFixed(this.rules.Price))
        };
    }
    logProfit(price) {
        if (this.startPrice != 0) {
            const profit = tools_1.Profit(price, this.startPrice);
            if (profit > 0)
                this.logger.console({ message: 'Profit:', success: profit.toFixed(3) + '%' });
            else
                this.logger.console({ message: 'Profit:', error: profit.toFixed(3) + '%' });
        }
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map
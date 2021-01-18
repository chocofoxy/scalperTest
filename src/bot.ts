import Binance from 'binance-api-node'
import { Operation, CoinRules, Limits, Conditions, min_Qty, min_Price, Logger, Options, Action, Profit } from './tools'
import * as fs from 'fs';
import { SMA, RSI } from 'technicalindicators'

export class Bot {

    tradeId: number = 0;
    client: any = null
    logFile: string
    startPrice: number = 0
    coin: string = "BTCUSDT"
    amount: number = 0
    qty: number = 0
    repeat: boolean = false
    action: Action = Action.Buy
    candlePeriod: string = "15m"
    rules: CoinRules = { Qty: 0, Price: 0 }
    limits: Limits = { Profit: 0.5, Loss: 0.02 }
    conditions: Conditions = { stopLoss: 0, stopProfit: 0 }
    logger: Logger = new Logger()
    bought: boolean = false
    scalping: boolean = false
    test: boolean = true
    sma: number[] = []
    rsi: number[] = []
    values: number[] = []

    constructor(private keys = { apiKey: 'API-KEY', apiSecret: 'API-KEY' }) {
        this.client = Binance(keys)
        this.logFile = `../logs/${Date.now()}.txt`
        fs.writeFile(this.logFile, '', () => {
            console.log('Creating log file ...')
        })
        this.getRules()
    }

    private async getRules() {
        const rules = await this.client.exchangeInfo()
        rules.symbols.forEach((symbol: any) => {
            if (symbol.symbol == this.coin) {
                this.rules = { Qty: min_Qty(symbol.filters[2].minQty), Price: min_Price(symbol.filters[0].minPrice) }
            }
        })
    }

    private async setOrder(operation: Operation, orderPrice: number, callback: Function) {
        let message = `Order to ${operation} ${this.coin} has been set at price ${orderPrice}`
        try {
            this.logger.log({ message: message, warning: '- Attempt' })
            this.action = Action.Pending
            const options = {
                symbol: this.coin,
                side: operation,
                quantity: this.qty,
                price: orderPrice,
            }
            if (this.test)
            await this.client.orderTest(options)
            else
            await this.client.order(options)
            callback()
            this.logger.log({ message: message, success: '- Complete' })
        } catch (e) {
            this.logger.log({ message: message, error: `- Failed: ${e.message}` })
            this.action = operation == 'SELL' ? Action.Sell : Action.Buy
        }
    }

    public async subscribe() {
        if (this.scalping) {
            this.action = Action.Stop
            this.calculatePrice()
        }
        this.client.ws.ticker(this.coin, (candle: any) => {
            let price: number = Number.parseFloat(candle.curDayClose)
            console.clear();
            this.logger.console({ message: 'TradeId:', warning: this.tradeId.toString() })
            this.logger.console({ message: `Price at`, success: price.toString() })
            this.logger.console({ message: 'Status:', warning: this.action })
            this.logProfit(price)
            switch (this.action) {
                case Action.Buy: this.buy(price); break;
                case Action.Sell: this.sell(price); break;
                case Action.Waiting: this.waiting(price); break;
            }
            console.log('AVG :', this.sma[this.sma.length - 1])
            console.log('RSI :', this.rsi[this.rsi.length - 1])
            console.log('Conditions :', this.conditions)
            console.log('------')
            console.log(this.logger.logs)
        })
    }

    sell(price: number) {
        if (price >= this.conditions.stopProfit || price <= this.conditions.stopLoss) {
            this.setOrder(Operation.Sell, price, () => {
                this.logger.log({ message: `Selling at`, info: price.toString() })
                this.action = Action.Waiting
            })
        }
    }

    buy(price: number) {
        this.qty = Number.parseFloat((this.amount / price).toFixed(this.rules.Qty))
        const callBack = () => {
            this.logger.log({ message: `Buying at`, info: price.toString() })
            this.updateLimits(price)
            this.action = Action.Waiting
        }
        if (this.scalping) {
            if (this.rsi[this.rsi.length - 1] < 20) {
                this.setOrder(Operation.Buy, price, callBack)
            }
        } else {
            this.setOrder(Operation.Buy, price, callBack)
        }
    }

    waiting(price: number) {
        if ((price >= this.startPrice) && !this.bought) {
            this.logger.log({ success: `Bought at ${price.toString()}` })
            this.startPrice = price
            this.action = Action.Sell
            this.bought = true
        } else if ((price >= this.conditions.stopProfit || price <= this.conditions.stopLoss) && this.bought) {
            this.logger.log({ success: `Sold at ${price.toString()}` })
            this.action = this.repeat ? Action.Buy : Action.Stop
            fs.appendFile(this.logFile, Profit(price, this.startPrice).toFixed(3) + "\n", () => { })
            this.bought = false
            this.logger.logs = ""
            this.tradeId++
            console.clear();
        }
    }

    private calculatePrice() {
        this.client.ws.candles(this.coin, this.candlePeriod, (candle: any) => {
            this.values.push(Number.parseFloat(candle.close))
            this.sma = SMA.calculate({ period: 15, values: this.values })
            this.rsi = RSI.calculate({ period: 15, values: this.values })
        })
        setTimeout(() => this.action = Action.Buy, 5 * 60 * 1000)
    }

    public configure(options: Options) {
        this.limits = options.limits
        this.amount = options.amount
        this.coin = options.coin
        this.test = options.test
        this.scalping = options.scalping
        this.repeat = options.repeat
    }

    private updateLimits(startPrice: number) {
        this.conditions = {
            stopLoss: Number.parseFloat((startPrice - (startPrice * this.limits.Loss)).toFixed(this.rules.Price)),
            stopProfit: Number.parseFloat((startPrice * (this.limits.Profit + 1)).toFixed(this.rules.Price))
        }
    }

    private logProfit(price: number) {
        if (this.startPrice != 0) {
            const profit: number = Profit(price, this.startPrice)
            if (profit > 0)
                this.logger.console({ message: 'Profit:', success: profit.toFixed(3) + '%' })
            else
                this.logger.console({ message: 'Profit:', error: profit.toFixed(3) + '%' })
        }
    }

}

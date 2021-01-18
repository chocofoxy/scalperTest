import moment from 'moment';

export interface Options {
    coin: string;
    limits: Limits;
    repeat: boolean;
    amount: number;
    scalping: boolean;
    test: boolean;
}

export interface CoinRules {
    Qty: number;
    Price: number;
}

export interface Limits {
    Loss: number;
    Profit: number;
}

export interface Conditions {
    stopLoss: number;
    stopProfit: number;
}

export enum Action {
    Pending = 'PENDING',
    Sell = 'SELLING',
    Buy = 'BUYING',
    Waiting = 'WAITING',
    Stop = 'STOPED'
}

export enum Operation {
    Sell = 'SELL',
    Buy = 'BUY'
}

interface Message {
    info?: string;
    error?: string;
    success?: string;
    message?: string;
    warning?: string;
}

export function min_Qty(qty: string) {
    qty = qty.split('1')[0]
    return qty.length == 0 ? 0 : qty.split('.')[1].length
}

export function min_Price(price: string) {
    price = price.split('1')[0]
    return price.length == 0 ? 0 : price.split('.')[1].length
}

export class Logger {

    logs: string = ''

    public log(message: Message) {
        this.logs = this.logs + this.template(message)
    }

    public console(message: Message) {
        console.log(this.template(message).replace(/\n/g, ''))
    }

    private template(message: Message) {
        return `\x1b[34m${moment().format('MMM Do YY, h:mm:ss a')} -\x1b[37m ${message.message || ''} \x1b[34m ${message.info || ''} \x1b[32m ${message.success || ''} \x1b[31m ${message.error || ''} \x1b[33m ${message.warning || ''} \x1b[37m `.replace(/\s{2,}/g, '').trim() + '\n'
    }
}

export function Profit(currentPrice: number, buyingPrice: number): number {
    return ((currentPrice - buyingPrice) / buyingPrice) * 100
}
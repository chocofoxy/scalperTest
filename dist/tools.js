"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profit = exports.Logger = exports.min_Price = exports.min_Qty = exports.Operation = exports.Action = void 0;
const moment_1 = __importDefault(require("moment"));
var Action;
(function (Action) {
    Action["Pending"] = "PENDING";
    Action["Sell"] = "SELLING";
    Action["Buy"] = "BUYING";
    Action["Waiting"] = "WAITING";
    Action["Stop"] = "STOPED";
})(Action = exports.Action || (exports.Action = {}));
var Operation;
(function (Operation) {
    Operation["Sell"] = "SELL";
    Operation["Buy"] = "BUY";
})(Operation = exports.Operation || (exports.Operation = {}));
function min_Qty(qty) {
    qty = qty.split('1')[0];
    return qty.length == 0 ? 0 : qty.split('.')[1].length;
}
exports.min_Qty = min_Qty;
function min_Price(price) {
    price = price.split('1')[0];
    return price.length == 0 ? 0 : price.split('.')[1].length;
}
exports.min_Price = min_Price;
class Logger {
    constructor() {
        this.logs = '';
    }
    log(message) {
        this.logs = this.logs + this.template(message);
    }
    console(message) {
        console.log(this.template(message).replace(/\n/g, ''));
    }
    template(message) {
        return `\x1b[34m${moment_1.default().format('MMM Do YY, h:mm:ss a')} -\x1b[37m ${message.message || ''} \x1b[34m ${message.info || ''} \x1b[32m ${message.success || ''} \x1b[31m ${message.error || ''} \x1b[33m ${message.warning || ''} \x1b[37m `.replace(/\s{2,}/g, '').trim() + '\n';
    }
}
exports.Logger = Logger;
function Profit(currentPrice, buyingPrice) {
    return ((currentPrice - buyingPrice) / buyingPrice) * 100;
}
exports.Profit = Profit;
//# sourceMappingURL=tools.js.map
import { Bot } from './bot'

const ApiKey = ''
const ApiSecret = ''

const client = new Bot({ apiKey: ApiKey, apiSecret: ApiSecret })

client.configure({
    coin: 'ADAUSDT',
    scalping: true ,
    amount: 20, 
    test: true ,
    repeat: true,
    limits: { Profit: 0.03, Loss: 0.01 }
})
client.subscribe()
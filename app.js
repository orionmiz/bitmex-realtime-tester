import moment from 'moment';
import readline from 'readline'
import wspkg from 'websocket'
const { w3cwebsocket } = wspkg;
import MyStrategy, { rsi } from './strategy.js';
import fs from 'fs'
import { log, logSync } from './util.js';
import crypto from 'crypto'
import { apiKey, apiSecret } from './secret.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const strategy = new MyStrategy(11810); // can be loaded from last log

let auth = false;
  
rl.on('line', function(line){
    console.log(`[CMD] : ${line}`);
    const [command, content] = line.split(' ');
    //const command = line.split(' ');
    switch(command) {
        case 'close':
            console.log('Bye!');
            logSync(JSON.stringify(strategy));
            process.exit(0);
            break;
        case 'sub':
            send({ op : 'subscribe', args : ['tradeBin1m:XBTUSD'] });
            break;
        case 'command':
            send({ op : content });
            break;
        case 'help':
            send('help');
            break;
        case 'recent':
            // 최근 포지션들 출력
            console.log('*************************************');
            strategy.recentPositions.forEach(pos => {
                console.log(`[${pos.enterTime}-${pos.disposeTime}]` + 
                `Position : ${pos.position} / ` +
                `Enter : ${pos.enterPrice} / ` +
                `Profit : ${(pos.profitRate * 100).toFixed(4)}% / ` +
                `MP : ${(pos.maxProfit * 100).toFixed(4)}% / ` +
                `ML : ${(pos.maxLoss * 100).toFixed(4)}% / ` +
                `Makeable : ${pos.makeable}`);
            });
            console.log('*************************************');
            break;
        case 'now':
            // 현재 포지션 출력
            console.log('*************************************');
            console.log(`Current Position : ${strategy.getPosition()}`);
            console.log(`Current Enter Price : ${strategy.getEnterPrice()}`);
            console.log(`Current Max Profit : ${(strategy.maxProfit * 100).toFixed(4)}%`);
            console.log(`Current Max Profit : ${(strategy.maxLoss * 100).toFixed(4)}%`);
            console.log(`Current Makeable : ${strategy.makeable}`);
            console.log('*************************************');
            break;
        case 'win':
            const winRate = (strategy.totalWin / strategy.totalTrade) * 100;
            console.log(`WinRate : ${winRate.toFixed(2)}%`)
            break;
        case 'profit':
            console.log(`Profit : ${strategy.money - strategy.baseMoney} / Rate : ${((strategy.money / strategy.baseMoney - 1) * 100).toFixed(4)}%`)
            break;
        case 'auth':
            /**
             * // signature is hex(HMAC_SHA256(secret, 'GET/realtime' + expires))
             * // expires must be a number, not a string.
             * {"op": "authKeyExpires", "args": ["<APIKey>", <expires>, "<signature>"]}
             */
            const verb = 'GET';
            const path = '/realtime';
            const expires = Math.round(new Date().getTime() / 1000) + Math.pow(2, 52); // persistent
            const signature = crypto.createHmac('sha256', apiSecret)
            .update(verb + path + expires)
            .digest('hex');
            send({ op : 'authKeyExpires', args : [apiKey, expires, signature] });
            break;
        case 'wallet':
            send({ op : 'subscribe', args : ['wallet'] });
            break;
        case 'start':
            /**
             * 1. auth first
             * 2. check wallet
             * 3. ask LEVERAGE
             * 4. calculate available money(USD) 
             */
            break;
    }
})

const ws = new w3cwebsocket('wss://www.bitmex.com/realtime');
//const ws = new w3cwebsocket('wss://www.bitmex.com/realtime?subscribe=instrument,orderBookL2_25:XBTUSD');



// 매 틱마다 이전 포지션의 최대, 최소 이익폭 갱신

const listener = (event) => {
    const data = JSON.parse(event.data);
    if (data.table === 'tradeBin1m') {
        const price = data.data[0].close;
        const time = moment(data.timestamp).format('hh:mm:ss');
        strategy.push(price);
        rsi([strategy.getPriceQueue()], [7], (err, res) => {
            if (res[0].length >= 1) { // big enough queue to calc rsi
                const currentRsi = res[0][0];
                const newSignal = currentRsi >= 50 ? 'Buy' : 'Sell'; // If you already have position, Put that here.
                if (strategy.getPosition()) { // only case switching between buy & sell
                    if (strategy.getEnterPrice() > 0)
                        strategy.update(price, data.data[0]);
                    if (strategy.getPosition() !== newSignal) {
                        if (strategy.getEnterPrice() > 0) { // switch!
                            strategy.dispose(price, time);
                        }
                        strategy.setEnterPrice(price);
                        strategy.enterTime = time;
                        log(`Enter ${newSignal} at : ${price}`, time);
                    }
                }
                strategy.setPosition(newSignal);
            } else {
                console.log('Collecting price data..');
            }
        });
        console.log(`[${time}] : ${price}`);
        // console.log(`Money : ${strategy.getMoney()}`) // dispose 시에만
    } else {
        console.log(data);
    }
}

ws.onopen = (event) => {
    console.log('open!');
    ws.addEventListener('message', listener);
    //send('help');
}

ws.onclose = (event) => {
    console.log('closed...')
}

const send = (cmd) => {
    ws.send(JSON.stringify(cmd));
}
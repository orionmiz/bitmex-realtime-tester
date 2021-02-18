import moment from 'moment';
import readline from 'readline'
import wspkg from 'websocket'
const { w3cwebsocket } = wspkg;
import MyStrategy, { rsi } from './strategy.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
  
rl.on('line', function(line){
    console.log(`[CMD] : ${line}`);
    const [command, content] = line.split(' ');
    switch(command) {
        case 'close':
            console.log('bye!');
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
    }
})

const ws = new w3cwebsocket('wss://www.bitmex.com/realtime');
//const ws = new w3cwebsocket('wss://www.bitmex.com/realtime?subscribe=instrument,orderBookL2_25:XBTUSD');

const strategy = new MyStrategy();


const listener = (event) => {
    const data = JSON.parse(event.data);
    if (data.table === 'tradeBin1m') {
        const price = data.data[0].close;
        strategy.push(price);
        rsi([strategy.getPriceQueue()], [7], (err, res) => {
            if (res[0].length >= 1) { // big enough queue to calc rsi
                const currentRsi = res[0][0];
                const newSignal = currentRsi >= 50 ? 'Buy' : 'Sell'; // If you already have position, Put that here.
                if (strategy.getPosition()) { // only case switching between buy & sell
                    if (strategy.getPosition() !== newSignal) {
                        if (strategy.getEnterPrice() > 0) {
                            strategy.dispose(price);
                        }
                        strategy.setEnterPrice(price);
                        console.log(`${newSignal} at : ${price}`);
                    }
                }
                strategy.setPosition(newSignal);
            } else {
                console.log('Collecting price data..');
            }
        });
        console.log(`[${moment(data.timestamp).format('hh:mm:ss')}] : ${price}`);
        console.log(`Money : ${strategy.getMoney()}`)
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

import tulind from 'tulind'

class MyStrategy {
    constructor(base = 10000, length = 7) {
        this.priceQueue = [];
        this.length = length;
        this.money = base;
        this.position = null;
        this.enterPrice = null;
    }

    push(val) {
        if (this.priceQueue.length >= this.length + 1) { // indicator length + 1
            this.priceQueue.shift();
        }
        this.priceQueue.push(val);
    }

    getPriceQueue() {
        return this.priceQueue;
    }

    getPosition() {
        return this.position;
    }

    setPosition(pos) {
        this.position = pos;
    }

    getEnterPrice() {
        return this.enterPrice;
    }

    setEnterPrice(price) {
        this.enterPrice = price;
    }

    getMoney() {
        return this.money;
    }

    dispose(now) { // switch position and calculate profits
        const flag = this.position === 'Buy' ? 1 : -1;
        const profitRate = flag * ((now / this.enterPrice) - 1);
        console.log(`Get ${profitRate > 0 ? 'Profit!' : 'Loss' } : ${profitRate * 100}%`);
        this.money *= 1 + profitRate;
    }
    
}

var open  = [4,5,5,5,4,4,4,6,6,6];
var high  = [9,7,8,7,8,8,7,7,8,7];
var low   = [1,2,3,3,2,1,2,2,2,3];
//var close = [4,5,6,6,6,5,5,5,6,4];
var close = [4,5,6,6,6,5,5]
var volume = [123,232,212,232,111,232,212,321,232,321];

//7-rsi의 이평이 50이상이면 매수 50이하면 매도
// 수수료 고려할것

export default MyStrategy;

/*tulind.indicators.rsi.indicator([close], [7], (err, res) => {
    console.log(res);
});*/

export const rsi = tulind.indicators.rsi.indicator;
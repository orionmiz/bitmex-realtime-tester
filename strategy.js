import tulind from 'tulind'
import { log } from './util.js';

class MyStrategy {
    constructor(base = 10000, length = 7) {
        this.priceQueue = [];
        this.length = length;
        this.baseMoney = base;
        this.money = this.baseMoney;
        this.position = null;
        this.enterPrice = null;
        this.maxProfit = 0;
        this.maxLoss = 0;
        this.makeable = false;
        this.totalTrade = 0;
        this.totalWin = 0;
        this.recentPositions = [];
        this.enterTime = null;
        this.disposeTime = null;
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

    dispose(now, time) { // switch position and calculate profits
        const flag = this.position === 'Buy' ? 1 : -1;
        let profitRate = flag * ((now / this.enterPrice) - 1);

        profitRate -= 0.0675 / 100 // trading fee

        //log(`Get ${profitRate > 0 ? 'Profit!' : 'Loss' } : ${profitRate * 100}%`, time);
        this.money *= 1 + profitRate;

        if (profitRate > 0) {
            this.totalWin++;
        }
        this.totalTrade++;

        const winRate = (this.totalWin / this.totalTrade) * 100; 

        log(`Position : ${this.position} / ` +
        `Enter : ${this.enterPrice} / ` + 
        `Profit : ${(profitRate * 100).toFixed(4)}% / ` +
        `MP : ${(this.maxProfit * 100).toFixed(4)}% / ` +
        `ML : ${(this.maxLoss * 100).toFixed(4)}% / ` +
        `WR : ${winRate.toFixed(2)}% / ` +
        `Makeable : ${this.makeable}`,
        `${this.enterTime}-${time}`);

        if (this.recentPositions.length > 10) {
            this.recentPositions.shift();
        }

        const { position, enterPrice, maxProfit, maxLoss, makeable, enterTime } = this

        this.recentPositions.push({
            position,
            enterPrice,
            maxProfit,
            maxLoss,
            makeable,
            enterTime,
            disposeTime : time,
            profitRate,
        });

        // init
        this.makeable = false;
        this.maxProfit = 0;
        this.maxLoss = 0;
    }

    // 포지션이 롱이면 low 넘겨주고 makeable 체크
    // 포지션이 숏이면 high 넘겨주고 makeable 체크
    update(now, tails) {
        const flag = this.position === 'Buy' ? 1 : -1;
        const profitRate = flag * ((now / this.enterPrice) - 1);
        if (now * flag > this.enterPrice * flag) { // update max profit
            this.maxProfit = Math.max(profitRate, this.maxProfit);
        } else if (now * flag < this.enterPrice * flag) { // update max loss
            this.makeable = true;
            this.maxLoss = Math.min(profitRate, this.maxLoss);
        } else { // same as before
        }

        if (flag === 1) { // long   
            if (tails.low < this.enterPrice)
                this.makeable = true;      
        } else { // short
            if (tails.high > this.enterPrice)
                this.makeable = true;
        }
    }
    
}

var open  = [4,5,5,5,4,4,4,6,6,6];
var high  = [9,7,8,7,8,8,7,7,8,7];
var low   = [1,2,3,3,2,1,2,2,2,3];
//var close = [4,5,6,6,6,5,5,5,6,4];
var close = [4,5,6,6,6,5,5]
var volume = [123,232,212,232,111,232,212,321,232,321];

//7-rsi의 이평이 50이상이면 매수 50이하면 매도
// 수수료 고려할것 Bitmex 0.0675, Binance 0.04
// Maker가 가능했던 포지션 vs Taker만 가능했던 포지션 기록 -> 다음 분 틱이 진입가보다 낮을경우 Maker 가능
// 최대 이익 %와 최대 손실 % 기록
// 거래횟수 기록
// 변동률이 trading fee와 비교해서 낮으면 가상매매로 넘기기를 기다렸다가 다음에 실전매매

export default MyStrategy;

/*tulind.indicators.rsi.indicator([close], [7], (err, res) => {
    console.log(res);
});*/

export const rsi = tulind.indicators.rsi.indicator;
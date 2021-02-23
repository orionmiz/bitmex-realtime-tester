import moment from 'moment'
import fs from 'fs'

const log = (text, time = moment().format('hh:mm:ss')) => {
    const format = moment().format('yyyy-MM-DD');
    console.log(`[${time}] : ${text}`);
    fs.appendFile(`logs/${format}.txt`, `\n[${time}] : ${text}`, (err, data) => {
        if (err)
            console.log(err);
    })
}

const logSync = (text, time = moment().format('hh:mm:ss')) => {
    const format = moment().format('yyyy-MM-DD');
    console.log(`[${time}] : ${text}`);
    try {
        fs.appendFileSync(`logs/${format}.txt`, `\n[${time}] : ${text}`);
    } catch (ex) {
        console.log(ex);
    }
}

export { log, logSync };
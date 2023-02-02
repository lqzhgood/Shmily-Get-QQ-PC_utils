/* eslint-disable no-extra-parens */
const fs = require('fs');
const { setT, db, findArrBeside } = require('./lib');

const { s60, pc } = require('./config.js');

// const s60 = require('./input/msg-qq_s60').filter(v => v.ms > 1298180052001 && v.ms <= 1298195235001);
// const pc = require('./input/msg-qq-pc').filter(v => v.ms > 1298180052001 && v.ms <= 1298195235001);
// fs.writeFileSync('./dist/pear-s60', JSON.stringify(s60, null, 4));
// fs.writeFileSync('./dist/pear-pc', JSON.stringify(pc, null, 4));

// new Date('2010/8/30 16:00:00').getTime()

console.time('t');

let count = 0;
let count2 = 0;

let countNum = {};

for (let i = 0; i < s60.length; i++) {
    const s = s60[i];

    if (s.ms > 1297935412001) setT(3.5 * 60 * 1000);
    if (s.ms < pc[0].ms) continue;

    if (!(s.type == '消息' || s.type == '忙')) continue;

    if (s.content.trim() == '') continue;
    if (s.content.includes('[图]')) continue;

    const pcSameArr = pc.reduce((pre, cV, cI) => {
        if (db(cV, s)) {
            pre.push(cI);
        }
        return pre;
    }, []);

    if (pcSameArr.length == 0) continue;

    if (pcSameArr.length == 1) {
        pc[pcSameArr[0]] = s;
        count++;
    }

    if (pcSameArr.length > 1) {
        const s60SameArr = findArrBeside(s60, i);
        // if (s.ms == 1298183122001) {
        //     console.log(
        //         'pcSameArr',
        //         pcSameArr.map(v => pc[v]),
        //     );
        //     console.log('s60SameArr', s60SameArr);
        // }
        // console.log(pcSameArr.length, s60SameArr.length);
        if (s60SameArr.length == pcSameArr.length) {
            pcSameArr.forEach((ip, index) => (pc[ip] = s60SameArr[index]));
            count2 += s60SameArr.length;
        } else {
            pcSameArr.forEach(ip => {
                if (!pc[ip]._Dev) pc[ip]._Dev = {};
                pc[ip]._Dev.same = pcSameArr.length;
            });
        }
    }

    if (!countNum[pcSameArr.length]) countNum[pcSameArr.length] = 0;

    countNum[pcSameArr.length]++;
}
countNum.count = count;
countNum.count2 = count2;
console.log('count', count);
console.log('count2', count2);

const pc_filter = pc.filter(v => v.source !== 'MobileQQ');
countNum.pc_filter = pc_filter.length;
console.log('pc_filter.length', pc_filter.length);

fs.writeFileSync('./dist/msg-qq-pc.json', JSON.stringify(pc_filter, null, 4));
fs.writeFileSync('./dist/countNum.json', JSON.stringify(countNum, null, 4));

console.timeEnd('t');

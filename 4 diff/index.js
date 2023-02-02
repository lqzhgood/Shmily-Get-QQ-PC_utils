console.time('T');

const fs = require('fs');
const _ = require('lodash');

const { imgDat, fixUrl, typeBusy, oneByOne } = require('./lib/index');

const n_o = require('./new/new-org');
const n_3 = require('./new/385219308');

let n = _.sortBy([].concat(n_o, n_3), 'ms');
typeBusy(n);

fs.writeFileSync('./new_merger.json', JSON.stringify(n, null, 4));

fixUrl(n);

const o_o = require('./old/old-org');

// 'source',     'device',
//   'type',       'direction',
//   'sender',     'senderName',
//   'receiver',   'receiverName',
//   'day',        'time',
//   'content',    'html',
//   'msAccuracy', 'ms',
//   'warn'

let o = o_o.map(v => {
    const source = v.source;
    const device = v.device;
    const type = v.type;
    const direction = v.direction;
    const sender = v.sender;
    const senderName = v.senderName;
    const receiver = v.receiver;
    const receiverName = v.receiverName;
    const day = v.day;
    const time = v.time;
    const ms = v.ms;
    const content = v.content;
    const html = imgDat(v.html);
    const msAccuracy = v.msAccuracy;

    if (!('msAccuracy' in v)) {
        console.warn('❌', 'not msAccuracy');
    }

    const obj = {
        source,
        device,
        type,
        direction,
        sender,
        senderName,
        receiver,
        receiverName,
        day,
        time,
        ms,
        content,
        html,
        msAccuracy,
    };

    if ('warn' in v) {
        obj.warn = v.warn;
    }

    return obj;
});
fixUrl(o);

fs.writeFileSync('./new_fix_notOneByOne.json', JSON.stringify(n, null, 4));

oneByOne(o, n);

o = [].concat(o.slice(0, 58), n.slice(58, 186), o.slice(58));

fs.writeFileSync('./old_fix.json', JSON.stringify(o, null, 4));
fs.writeFileSync('./new_fix.json', JSON.stringify(n, null, 4));

console.timeEnd('T');

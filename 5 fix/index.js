const fs = require('fs');
const _ = require('lodash');
const config = require('./config');

const { needClear, clearRepeat } = require('./lib/clearRepeat');

let msgArr = require(config.MSG_JSON_FILE);
const { directionCheck, voip, busy, file, face, text, image, HAS_FILES, LOST_FILES } = require('./lib/index.js');
if (!fs.existsSync('./dist/file')) fs.mkdirSync('./dist/file');

// {
//     "source": "QQ",
//     "device": "PC",
//     "type": "消息",
//     "direction": "go",
//     "sender": "110",
//     "senderName": "name~",
//     "receiver": "119",
//     "receiverName": " name",
//     "day": "2010-08-15",
//     "time": "17:07:52",
//     "ms": 1281863272000,
//     "content": "zhuzhu ",
//     "html": "<font style=\"font-size:9pt;font-family:'宋体','MS Sans Serif',sans-serif;\" color=\"8080FF\">zhuzhu </font>",
//     $Dev:{"msAccuracy": false}
// },

msgArr.forEach((m, i) => {
    voip(m, i, msgArr);
    busy(m, i, msgArr);
    file(m, i, msgArr);
    face(m, i, msgArr);
    text(m, i, msgArr);
    image(m, i, msgArr);

    directionCheck(m, i, msgArr);

    // if (m.type != '文件' && m.content.includes('文件')) {
    //     console.warn('文件可能未识别', m);
    // }

    if (m.type === '文件' && !_.get(m, '$QQ.data.fileParse')) {
        console.warn('❌', '文件无属性', m);
    }
});

if (needClear) msgArr = clearRepeat(msgArr);

fs.writeFileSync('./dist/msg-qq-pc.json', JSON.stringify(msgArr, null, 4));
fs.writeFileSync('./dist/HAS_FILES.json', JSON.stringify(_(HAS_FILES).union(), null, 4));

fs.writeFileSync(
    './dist/LOST_FILES.json',
    JSON.stringify(
        _(LOST_FILES)
            .unionBy('1')
            .value()
            .map(v => v.join(' _ ')),
        null,
        4,
    ),
);

console.log('ok');

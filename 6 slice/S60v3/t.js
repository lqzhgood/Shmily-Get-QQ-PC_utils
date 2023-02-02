const { clearSuffix, db } = require('./lib');

const pc = {
    source: 'QQ',
    device: 'PC',
    type: '消息',
    direction: 'go',
    sender: '119',
    senderName: 'name~ ',
    receiver: '110',
    receiverName: 'name',
    day: '2012-03-02',
    time: '21:48:56',
    ms: 1330696136000,
    content: '哦',
    html: '<font style="font-size:9pt;font-family:\'宋体\',\'MS Sans Serif\',sans-serif;" color="000000">百度百科有  </font>',
    id: 'msg-qq-pc.json_2012-02-22_01-40-53_8931a3_1',
    index: 88588,
};
const s60 = {
    source: 'QQ',
    device: 'PC',
    type: '消息',
    direction: 'go',
    sender: '119',
    senderName: 'name~ ',
    receiver: '110',
    receiverName: 'name',
    day: '2012-03-02',
    time: '21:48:56',
    ms: 1330696136000,
    content: '哦 \n(好久没听到你声音了，来玩语音对讲吧！来自 QQ for iPhone) ',
    html: '<font style="font-size:9pt;font-family:\'宋体\',\'MS Sans Serif\',sans-serif;" color="000000">哦 <br>(好久没听到你声音了，来玩语音对讲吧！来自 QQ for iPhone) </font>',
    id: 'msg-qq-pc.json_2012-03-02_21-48-56_128fcf_1',
    index: 89466,
};
let T = 120 * 1000;

console.log('res', dbDebug(pc, s60));

function dbDebug(p, s) {
    console.log(1, p.source == 'QQ');
    console.log(2, p.ms >= s.ms - T);
    console.log(3, p.ms <= s.ms + T);
    console.log(4, p.sender === s.sender);
    console.log(5, p.receiver === s.receiver);
    console.log(6, p.direction === s.direction);
    console.log(7, clearSuffix(p.content) === clearSuffix(s.content));
    console.log('7-p', clearSuffix(p.content));
    console.log('7-s', clearSuffix(s.content));

    return db(p, s);
}

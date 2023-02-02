let T = 120 * 1000;

function setT(t) {
    T = t;
}

// 删除各种小尾巴后进行比较
function db(p, s) {
    return (
        p.source == 'QQ' &&
        p.ms >= s.ms - T &&
        p.ms <= s.ms + T &&
        p.sender === s.sender &&
        p.receiver === s.receiver &&
        p.direction === s.direction &&
        clearSuffix(p.content) === clearSuffix(s.content)
    );
}

// 往上或者往下寻找一样的消息
function dbS60(p, s) {
    return (
        p.sender === s.sender &&
        p.receiver === s.receiver &&
        p.direction === s.direction &&
        clearSuffix(p.content) === clearSuffix(s.content)
    );
}

// 有空格不一样的
function clearSuffix(s) {
    return (
        s
            .replace(/\(本消息由您的好友通过手机QQ发送，体验手机QQ请登录：\shttp:\/\/mobile\.qq\.com\/c\s\)\s/, '')
            .replace(/\(来自手机QQ：\shttp:\/\/mobile\.qq\.com\/c\s\)\s/, '')
            .replace(/\(来自手机QQ:\shttp:\/\/mobile\.qq\.com\/v\/\s\)\s/, '')
            .replace(/\(来自手机QQ:\shttp:\/\/mobile\.qq\.com\s\)/, '')
            .replace(/\(iPhone\sQQ支持视频了:\shttp:\/\/mobile\.qq\.com\/v\/\s\)\s/, '')
            .replace(/【提示：此用户正在使用WebQQ：http:\/\/web\.qq\.com\/】\s/, '')
            .replace(/\(来自乔布斯的iPhone:\shttp:\/\/mobile\.qq\.com\/v\/\s\)\s/, '')
            //(好久没听到你声音了，来玩语音对讲吧！来自 QQ for iPhone)
            .replace(/\(好久没听到你声音了，来玩语音对讲吧！来自\sQQ\sfor\siPhone\)/, '')
            // (来自手机QQ2012 [Android]:语音对讲，高效沟通！)
            .replace(/\(来自手机QQ2012\s\[Android\]\:语音对讲，高效沟通！\)/, '')
            .replace(/\s/gm, ' ')
            .trim()
    );
}
function findArrBeside(arr, i) {
    const curr = arr[i];
    let bi = i - 1;
    const bMs = curr.ms - T;
    const before = [];

    let ai = i + 1;
    const aMs = curr.ms + T;
    const after = [];

    while (arr[bi] && arr[bi].ms >= bMs) {
        if (dbS60(arr[bi], curr)) before.unshift(arr[bi]);
        bi--;
    }

    while (arr[ai] && arr[ai].ms <= aMs) {
        if (dbS60(arr[ai], curr)) after.push(arr[ai]);
        ai++;
    }

    return [...before, curr, ...after];
}

module.exports = {
    setT,
    clearSuffix,
    db,
    dbS60,
    findArrBeside,
};

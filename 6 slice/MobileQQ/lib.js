const config = require('./config.js');

// 用于修改误差时间
function setT(t) {
    config.MISTAKE_TIME = t;
}

// 删除各种小尾巴后进行比较
function dbSlice(s, c) {
    return (
        s.source === config.SLICE_SOURCE && // 整段替换的缘故 可能有一些是 SLICE 的数据要排除
        s.ms >= c.ms - config.MISTAKE_TIME &&
        s.ms <= c.ms + config.MISTAKE_TIME &&
        s.sender === c.sender &&
        s.receiver === c.receiver &&
        s.direction === c.direction &&
        clearSuffix(s.content) === clearSuffix(c.content)
    );
}

// 往上或者往下寻找一样的消息
function dbControl(s, c) {
    return (
        s.sender === c.sender &&
        s.receiver === c.receiver &&
        s.direction === c.direction &&
        clearSuffix(s.content) === clearSuffix(c.content)
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
            .replace(/\(来自手机QQ2012\s\[Android\]:语音对讲，高效沟通！\)/, '')
            .replace(/\s/gm, ' ')
            .trim()
    );
}
/**
 * @name:
 * @description: 往上和往下寻找一样的消息
 * @param {*} arr
 * @param {*} i
 * @return {*}
 */
function findArrBeside(arr, i) {
    const curr = arr[i];
    // before
    let bi = i - 1;
    const bMs = curr.ms - config.MISTAKE_TIME;
    const before = [];

    // after
    let ai = i + 1;
    const aMs = curr.ms + config.MISTAKE_TIME;
    const after = [];

    while (arr[bi] && arr[bi].ms >= bMs) {
        if (dbControl(arr[bi], curr)) before.unshift(arr[bi]);
        bi--;
    }

    while (arr[ai] && arr[ai].ms <= aMs) {
        if (dbControl(arr[ai], curr)) after.push(arr[ai]);
        ai++;
    }

    return [...before, curr, ...after];
}

module.exports = {
    setT,
    clearSuffix,
    dbSlice,
    dbControl,
    findArrBeside,
};

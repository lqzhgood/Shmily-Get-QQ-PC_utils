// 对照组
// const CONTROL_FILE = 'msg-qq_s60.json';
// 裁剪组
// const SLICE_FILE = 'msg-qq-pc.json';
const CONTROL_FILE = 'msg-qq_android.json';
const SLICE_FILE = 'msg-qq-pc.json';

const CONTROL_ARR = require(`./input/${CONTROL_FILE}`);
const SLICE_ARR = require(`./input/${SLICE_FILE}`);

const CONTROL_SOURCE = CONTROL_ARR[0].source;
const SLICE_SOURCE = SLICE_ARR[0].source;

console.log('CONTROL', CONTROL_ARR.length, CONTROL_SOURCE);
console.log('SLICE', SLICE_ARR.length, SLICE_SOURCE);

module.exports = {
    SLICE_FILE,
    CONTROL_ARR, // 作为对照的数组
    SLICE_ARR, // 需要被删除的数组
    // MISTAKE_TIME: 120 * 1000, // 毫秒
    MISTAKE_TIME: 3000, // 毫秒
    CONTROL_SOURCE,
    SLICE_SOURCE,
};

/* eslint-disable no-extra-parens */
const fs = require('fs');
const { setT, dbSlice, findArrBeside } = require('./lib');

const { SLICE_FILE, CONTROL_ARR, SLICE_ARR, CONTROL_SOURCE } = require('./config');

console.time('t');

let count = 0; // 单个消息一样删除了多少次
let count2 = 0; // 大段消息完全一样 删除了多少个

// 统计整块长度一样的消息 分别删除了多少个
let countNum = {};

// fs.writeFileSync('./dist/s.json', JSON.stringify(SLICE_ARR, null, 4));
// fs.writeFileSync('./dist/c.json', JSON.stringify(CONTROL_ARR, null, 4));

for (let i = 0; i < CONTROL_ARR.length; i++) {
    const c = CONTROL_ARR[i];

    if (c.ms < SLICE_ARR[0].ms) continue;

    // 只对比 有内容 且不含图的 [消息]
    if (!(c.type == '消息' || c.type == '忙')) continue;
    if (c.content.trim() == '') continue;
    if (c.content.includes('[图]')) continue;

    // 从整个 Slice 寻找时间范围在 MISTAKE_TIME ,且内容和当前 c "相同" 的消息
    const sliceSameArr = SLICE_ARR.reduce((pre, cV, cI) => {
        if (dbSlice(cV, c)) {
            pre.push(cI);
        }
        return pre;
    }, []);

    // 如果没找到，则说明当前 slice 组的消息是唯一的 跳过
    if (sliceSameArr.length == 0) continue;

    // 如果找到了，则说明当前 slice 组的消息和 control 组一一对应，赋值替换
    if (sliceSameArr.length == 1) {
        SLICE_ARR[sliceSameArr[0]] = c;
        count++;
    }

    // 如果大于1，则说明当前 slice 组的消息和 control 组有多个重合
    // 可能是连续的相同内容刷屏 需要继续判断
    if (sliceSameArr.length > 1) {
        // 获取对照组当前前后内容一样的消息数组 (刷屏内容一样的消息)
        const controlSameArr = findArrBeside(CONTROL_ARR, i);
        if (controlSameArr.length == sliceSameArr.length) {
            // 如果两者相等,说明这一大段都是刷屏内容 且刷屏长度一样 将 slice 组的消息全部替换
            sliceSameArr.forEach((ip, index) => (SLICE_ARR[ip] = controlSameArr[index]));
            count2 += controlSameArr.length;
        } else {
            // 否则无法判断,将疑问数量写入 .same 标记，前端 DevFlag 会显示用于手动判断
            sliceSameArr.forEach(ip => {
                if (!SLICE_ARR[ip]._Dev) SLICE_ARR[ip]._Dev = {};
                SLICE_ARR[ip]._Dev.same = sliceSameArr.length;
            });
        }
    }

    // 统计 n 块一样的消息 被删除次数
    if (!countNum[sliceSameArr.length]) countNum[sliceSameArr.length] = 0;
    countNum[sliceSameArr.length]++;
}
// 过滤掉被覆盖的 control 组元素,剩下的就是 slice 组唯一的元素
const sliceArr_filter = SLICE_ARR.filter(v => v.source !== CONTROL_SOURCE);
fs.writeFileSync(`./dist/${SLICE_FILE}`, JSON.stringify(sliceArr_filter, null, 4));

console.log('去重后的长度 sliceArr', sliceArr_filter.length);

// 统计相关
countNum.count = count;
countNum.count2 = count2;
console.log('精确命中次数', count);
console.log('大块命中次数', count2);
countNum.sliceArr_filter = sliceArr_filter.length;
fs.writeFileSync('./dist/countNum.json', JSON.stringify(countNum, null, 4));

console.timeEnd('t');

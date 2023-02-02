const _ = require('lodash');

const needClear = false;
const clearStartMs = 1367211416000;
const clearSameNumber = 3; // 连续多少个重复消息才算删除

// 腾讯同步有 bug, 会造成消息重复显示
// 如 a b c
// a
// a
// b
// b
// c
// c
// e
// f
// g
// h
// 此命令用于删除以上重复的消息 但要注意大量刷屏表情的情况需要排除
function clearRepeat(arr) {
    const sMs = clearStartMs || 0;
    const index = arr.findIndex(v => v.ms >= sMs);

    let isSameArr = [];

    for (let i = index; i < arr.length; i++) {
        if (i === 0) continue;

        const o = arr[i - 1];
        const n = arr[i];
        const n_1 = _.cloneDeep(n);
        n_1.ms -= 1000;

        if (_.isEqual(o, n) || _.isEqual(o, n_1)) {
            isSameArr.push(i);
            i++; // 跳过下一个, 因为比较的是下一对
        } else {
            if (isSameArr.length >= clearSameNumber) {
                isSameArr.forEach(num => {
                    arr[num] = undefined;
                });
            }
            isSameArr = [];
        }
    }
    console.log('去重数量：', arr.filter(v => !v).length);
    return arr.filter(v => !v);
}

module.exports = {
    needClear,
    clearRepeat,
};

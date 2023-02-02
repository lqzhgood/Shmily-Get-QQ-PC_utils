const all = require('./qq_rich_copy_msg');

const type = all.reduce((pre, cV) => {
    pre.push(cV.type);
    return pre;
}, []);

const x = all.filter(v => !v.type);

console.log('x', x);
console.log('', new Array(...new Set(type)));

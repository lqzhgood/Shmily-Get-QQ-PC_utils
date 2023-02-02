const fs = require('fs');

const slms = 1470399679000;

sl('1');
sl('qq_rich_copy_msg');

function sl(name) {
    const arr = require(`./${name}.json`);
    const findIndex = arr.findIndex(v => v.ms >= slms);

    const h = arr.slice(0, findIndex);
    const e = arr.slice(findIndex);

    if (h.length + e.length != arr.length) throw new Error();

    fs.writeFileSync(`./${name}-h.json`, JSON.stringify(h, null, 4));
    fs.writeFileSync(`./${name}-e.json`, JSON.stringify(e, null, 4));
}

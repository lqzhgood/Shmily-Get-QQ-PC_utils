const fs = require('fs');
const path = require('path');

const cutMs = 1283160140000;

const inputDir = './input/';
const outDir = './output/';

const inputFiles = fs.readdirSync(inputDir).forEach(f => {
    const json = JSON.parse(fs.readFileSync(path.join(inputDir, f)));
    const length_all = json.length;

    const index = json.findIndex(v => v.ms > cutMs);
    const after = json.splice(index);

    if (json.length + after.length != length_all) {
        throw new Error();
    }

    fs.writeFileSync(path.join(outDir, `${f}_before`), JSON.stringify(json, null, 4));
    fs.writeFileSync(path.join(outDir, `${f}_after`), JSON.stringify(after, null, 4));
});

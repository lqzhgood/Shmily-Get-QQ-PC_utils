const fs = require('fs-extra');
const face = require('./face.json');

const faceArr = face
    .filter(v => v.type != 'emoji' && v.type != 'QQ经典' && v.type != '阿狸')
    .map(f => {
        const { md5, size, ext } = f;

        if (!f.md5) console.warn('❌', 'f', f);
        delete f.md5;
        if (!f.ext) console.warn('❌', 'f', f);
        delete f.ext;
        if (!f.size) console.warn('❌', 'f', f);
        delete f.size;

        const obj = { ...f, files: [{ md5, size, ext }] };
        return obj;
    });

console.log('faceArr', faceArr);
fs.writeFileSync('./emojiArr.json', JSON.stringify(faceArr, null, 4));

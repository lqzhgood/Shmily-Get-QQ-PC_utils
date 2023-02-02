const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const config = require('../config.js');

const json = require(path.join(__dirname, config.MSG_JSON_FILE));

const imgMd5Arr = fs
    // 所有图片文件名列表  dir /b
    // .readFileSync('./AllIMG.txt', 'utf-8')
    .readdirSync(config.IMG_DIR)
    .split('\n')
    .filter(v => v);

json.forEach(m => {
    if (m.type !== '文件') checkImg(m);
});

function checkImg(m, i, msgArr) {
    const $ = cheerio.load(m.html, { decodeEntities: false }, null);
    const imgs = $('img');
    Array.from(imgs).forEach(img => {
        const { src } = img.attribs;
        if (src.startsWith('lostImg_')) return;
        const { name, ext } = path.parse(src);
        const f = imgMd5Arr.some(v => v.startsWith(name));
        if (!f) {
            console.warn('❌', 'not found', m);
        }
    });
}

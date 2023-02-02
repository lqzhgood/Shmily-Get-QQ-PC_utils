const fs = require('fs');
const cheerio = require('cheerio');
const _ = require('lodash');

const { M, Y } = require('../config.js');

function imgDat(html) {
    if (/<img src=/.test(html)) {
        const $ = cheerio.load(`<div id="inner_html">${html}</div>`, { decodeEntities: false });

        const $img = $('#inner_html').find('img');

        let lostImg = 0;
        $img.each((i, n) => {
            const { src } = n.attribs;
            if (/^\{[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}\}\.dat$/.test(src)) {
                // {A26B54AB-AA8A-4c1c-882A-EF18CE9611ED}.dat 这样的格式表示图片文件丢失
                n.attribs.src = `lostImg_${lostImg}`;
                lostImg++;
            }
        });
        return $('#inner_html')
            .html()
            .replace(/&nbsp;/gm, ' ');
    } else {
        return html;
    }
}

function fixUrl(arr) {
    return arr.map(c => {
        c.content = c.content.replace(/(\[安全网站\]|\[危险网站\]|\[未知网站\])/gm, '');
        c.html = c.html.replace(
            /<img src="\.\/data\/qq-pc\/face\/(1a8af654bc63c16c196a172e7626eb7c|f1ebec09a6a924e66654e11bbf3e8827|3daf85f7dce831623b13f26d179355b4|5da0f90bee380857c78fea3af9114e32).png" alt="(安全网站|危险网站|未知网站)">/gm,
            '',
        );

        if (c.content == '[图片无法显示]') {
            c.content = '[图]';
        }
        if (c.html == '<img src="./data/qq-pc/face/2180ee73c1c30b6604c98102af9a844e.png" alt="图片无法显示">') {
            c.html = '<img src="./data/qq-pc/img/____dc5ede7b03528d416d76100bef428a8d.png">';
        }
        if (c.html == '<img src="./data/qq-pc/img/dc5ede7b03528d416d76100bef428a8d.png">') {
            c.html = '<img src="./data/qq-pc/img/____dc5ede7b03528d416d76100bef428a8d.png">';
        }

        // c.content = c.content.replace(/\[图片无法显示\]/g, '[图]');
        c.html = c.html.replace(
            /<img src='.\/data\/qq-pc\/face\/(1a8af654bc63c16c196a172e7626eb7c|f1ebec09a6a924e66654e11bbf3e8827|3daf85f7dce831623b13f26d179355b4|5da0f90bee380857c78fea3af9114e32).png' alt='(安全网站|危险网站|未知网站)' \/>/gm,
            '',
        );

        return c;
    });
}

function typeBusy(arr) {
    return arr.map(v => {
        if (v.content == '您好，我现在有事不在，一会再和您联系。') {
            v.type = '忙';
        }
        return v;
    });
}

function sameContent(arr) {
    if (!arr || arr.length == 0) return false;
    if (arr.length == 1) return true;
    return (
        _.unionWith(
            arr.map(v => ({ ms: v.ms, content: v.content, html: v.html })),
            _.isEqual,
        ).length == 1
    );
}

function oneByOne(o, n) {
    o.forEach(c => {
        const FilterMs = n.filter(a => a.ms == c.ms);
        if (sameContent(FilterMs)) {
            c.direction = FilterMs[0].direction;
            c.sender = FilterMs[0].sender;
            c.senderName = FilterMs[0].senderName;
            c.receiver = FilterMs[0].receiver;
            c.receiverName = FilterMs[0].receiverName;
        }

        {
            let n_find = FilterMs.filter(a => dbStr('all', a) == dbStr('all', c));
            if (n_find && sameContent(n_find)) {
                n_find = n_find[0];

                name(n_find, c);
                return;
            }
        }
        {
            // 除了 html 一样的
            let n_find = FilterMs.filter(a => dbStr('html', a) == dbStr('html', c) && a.html != c.html);
            if (n_find && sameContent(n_find)) {
                n_find = n_find[0];
                name(n_find, c);

                if (n_find.html === c.html) return;

                // html 样式对比
                const ah = getText(n_find.html);
                const ch = getText(c.html);

                if (ah == ch) {
                    getElmNameArr(n_find.html);
                    getElmNameArr(c.html);
                    c.html = n_find.html;
                    return;
                }

                // html - img 样式对比
                const ahm = getImgText(n_find.html);
                const chm = getImgText(c.html);

                // 说明结构一样 但是 img 属性可能不一样
                if (ahm == chm) {
                    const html = mergerImgHtml(n_find.html, c.html, n_find);
                    n_find.html = html;
                    c.html = html;
                }

                return;
            }
        }
        {
            let n_find = FilterMs.filter(
                a => dbStr('time', a) == dbStr('time', c) && a.html != c.html && a.content != c.content,
            );
            if (n_find && sameContent(n_find)) {
                n_find = n_find[0];

                name(n_find, c);

                if (c.html == '' && c.content == '') {
                    c.html = n_find.html;
                    c.content = n_find.content;
                    return;
                }

                if (n_find.html == '' && n_find.content == '') {
                    n_find.html = c.html;
                    n_find.content = c.content;
                    return;
                }

                // // 这里处理太复杂了 而且只有40个 手动算了
                // // html - img 样式对比
                // const ahm = getImgText(faT.html);
                // const chm = getImgText(c.html);

                // // 说明结构一样 但是 img 属性可能不一样
                // if (ahm == chm) {
                //     const html = mergerImgHtml(faT.html, c.html, faT);
                //     faT.html = html;
                //     c.html = html;
                // content 没处理
                //     console.count('xxx');
                // }
            }
        }
    });
}

function mergerImgHtml(ah, ch, fa) {
    const $a = cheerio.load(`<div id="_ReadHtml">${ah}</div>`, { decodeEntities: false });
    const aimg = $a('#_ReadHtml').find('img');

    const $c = cheerio.load(`<div id="_ReadHtml">${ch}</div>`, { decodeEntities: false });
    const cimg = $c('#_ReadHtml').find('img');

    if (aimg.length != cimg.length) {
        throw new Error('aimg != cimg');
    }

    Array.from(aimg).forEach((v, i) => {
        if (_.isEqual(aimg[i].attribs, cimg[i].attribs)) {
            return;
        }
        const src_a = aimg[i].attribs.src;
        const src_c = cimg[i].attribs.src;
        if (src_a.startsWith('lostImg_') && src_c.startsWith('lostImg_')) {
            return;
        }
        if (src_a.startsWith('lostImg_') && !src_c.startsWith('lostImg_')) {
            aimg[i].attribs = { ...cimg[i].attribs };
            return;
        }
        if (!src_a.startsWith('lostImg_') && src_c.startsWith('lostImg_')) {
            cimg[i].attribs = { ...aimg[i].attribs };
            return;
        }
        if (!src_a.startsWith('lostImg_') && !src_c.startsWith('lostImg_')) {
            console.warn('❌', '两个 img src 不一样');
            console.log('ah', ah);
            console.log('ch', ch);
            // console.log('fa', fa);
            console.count('两个 img src 不一样');
            console.log('');
            return;
        }
    });

    return $a('#_ReadHtml').html();
}

function getElmNameArr(html) {
    const ALL_ELMS = ['br', 'font', 'img', 'span', 'a'];

    const $ = cheerio.load(`<div id="_ReadHtml">${html}</div>`, { decodeEntities: false });
    const x = Array.from(
        $('#_ReadHtml')
            .find('*')
            .map((i, v) => {
                return v.name;
            }),
    );

    const sy = _.pullAll([...x], ALL_ELMS);
    if (sy.length != 0) console.log('sy', sy);
    return x;
}

function getText(html) {
    const $ = cheerio.load(`<div id="_ReadHtml">${html}</div>`, { decodeEntities: false });

    $('#_ReadHtml')
        .find('img')
        .replaceWith((i, elm) => {
            const { src, alt } = elm.attribs;
            return `<span>|__|${src}|__|${alt}|__|</span>`;
        });

    $('#_ReadHtml')
        .find('br')
        .replaceWith((i, elm) => {
            return `<span>\n</span>`;
        });
    return $('#_ReadHtml').text();
}

function getImgText(html) {
    const $ = cheerio.load(`<div id="_ReadHtml">${html}</div>`, { decodeEntities: false });

    $('#_ReadHtml')
        .find('img')
        .replaceWith((i, elm) => {
            const { src, alt } = elm.attribs;
            return `<span>|__|I'm Img|__|</span>`;
        });

    $('#_ReadHtml')
        .find('br')
        .replaceWith((i, elm) => {
            return `<span>\n</span>`;
        });
    return $('#_ReadHtml').text();
}

function dbStr(type, m) {
    switch (type) {
        case 'all':
            return `${m.type}_-_${m.ms}_-_${m.direction}_-_${m.sender}_-_${m.receiver}_-_${m.content}_-_${m.html}`;
        case 'html':
            return `${m.type}_-_${m.ms}_-_${m.direction}_-_${m.sender}_-_${m.receiver}_-_${m.content}`;
        case 'time':
            return `${m.type}_-_${m.ms}_-_${m.direction}_-_${m.sender}_-_${m.receiver}`;
        default:
            throw new Error('');
    }
}

function name(check, modify) {
    if (modify.senderName !== check.senderName) {
        // 先看看是不是都是 M 数组内的
        const fma = M.find(m => m == modify.senderName.trim());
        const fmc = M.find(m => m == check.senderName.trim());

        if (fma && fmc) {
            modify.senderName = check.senderName;
            modify.direction = check.direction;
        }

        const fya = Y.find(m => m == modify.senderName.trim());
        const fyc = Y.find(m => m == check.senderName.trim());
        if (fya && fyc) {
            modify.senderName = check.senderName;
            modify.direction = check.direction;
        }

        if (!fma && !fmc && !fya && !fyc) {
            console.log(modify.senderName, check.senderName);
        }
    }

    if (modify.receiverName !== check.receiverName) {
        // 先看看是不是都是 M 数组内的
        const fma = M.find(m => m == modify.receiverName.trim());
        const fmc = M.find(m => m == check.receiverName.trim());

        if (fma && fmc) {
            modify.receiverName = check.receiverName;
            modify.direction = check.direction;
        }

        const fya = Y.find(m => m == modify.receiverName.trim());
        const fyc = Y.find(m => m == check.receiverName.trim());
        if (fya && fyc) {
            modify.receiverName = check.receiverName;
            modify.direction = check.direction;
        }

        if (!fma && !fmc && !fya && !fyc) {
            console.log(`|${modify.receiverName}|`, `|${check.receiverName}|`);
        }
    }
}

module.exports = {
    imgDat,
    fixUrl,
    typeBusy,
    oneByOne,
};

/* eslint-disable no-irregular-whitespace */
const dayjs = require('dayjs');
const _ = require('lodash');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const config = require('../config');

const { MN, M, YN, Y } = config;

const FACE_ARR = require(config.FACE_FILE);
const IMG_ARR = fs.readdirSync(config.IMG_DIR).reduce((pre, cV) => {
    const f = path.join(config.IMG_DIR, cV);
    if (!fs.statSync(f).isDirectory()) {
        const { name: md5, ext } = path.parse(f);
        pre.push({ md5, ext });
    }
    return pre;
}, []);

// 检查 IMG 里面是不是有 表情
const FACE_ARR_TXT = JSON.stringify(FACE_ARR);

IMG_ARR.forEach(({ md5, ext }) => {
    const f = FACE_ARR_TXT.includes(md5);
    if (!f) {
        fs.mkdirpSync(path.join(__dirname, '../dist/img/'));
        fs.copyFileSync(
            path.join(config.IMG_DIR, `${md5}${ext}`),
            path.join(__dirname, '../dist/img/', `${md5}${ext}`),
        );
    } else {
        // console.log('图片中含有表情', md5);
    }
});

const { directionExchange, htmlToText, replaceAll } = require('./utils');

const FILE_DIR_TARGET = config.FILE_DIR;
const FILES_ATTACHMENT = fs.readdirSync(FILE_DIR_TARGET).map(f => ({ o: f, n: f.replace(/\s/g, ' ') }));

function directionCheck(m, i, msgArr) {
    if (m.direction == 'go') {
        if (!m.senderName.trim()) {
            const m_l = msgArr[i - 1];
            if (m_l.direction == 'go') {
                m.senderName = m_l.senderName;
            } else {
                m.senderName = m_l.receiverName;
            }
        }

        if (!m.receiverName.trim()) {
            const m_l = msgArr[i - 1];
            if (m_l.direction == 'go') {
                m.receiverName = m_l.receiverName;
            } else {
                m.receiverName = m_l.senderName;
            }
        }

        if (!MN.some(n => n == m.sender.trim())) console.warn('❌', i, m, `m.sender`, `|${m.sender}|`);
        if (!M.some(n => n == m.senderName.trim())) console.warn('❌', i, m, `m.senderName`, `|${m.senderName}|`);
        if (!YN.some(n => n == m.receiver.trim())) console.warn('❌', i, m, `m.receiver`, `|${m.receiver}|`);
        if (!Y.some(n => n == m.receiverName.trim())) console.warn('❌', i, m, `m.receiverName`, `|${m.receiverName}|`);
    } else if (m.direction == 'come') {
        if (!m.senderName.trim()) {
            const m_l = msgArr[i - 1];
            if (m_l.direction == 'come') {
                m.senderName = m_l.senderName;
            } else {
                m.senderName = m_l.receiverName;
            }
        }

        if (!m.receiverName.trim()) {
            const m_l = msgArr[i - 1];
            if (m_l.direction == 'come') {
                m.receiverName = m_l.receiverName;
            } else {
                m.receiverName = m_l.senderName;
            }
        }

        if (!YN.some(n => n == m.sender.trim())) console.warn('❌', i, m, `m.sender`, `|${m.sender}|`);
        if (!Y.some(n => n == m.senderName.trim())) console.warn('❌', i, m, `m.senderName`, `|${m.senderName}|`);
        if (!MN.some(n => n == m.receiver.trim())) console.warn('❌', i, m, `m.receiver`, `|${m.receiver}|`);
        if (!M.some(n => n == m.receiverName.trim())) console.warn('❌', i, m, `m.receiverName`, `|${m.receiverName}|`);
    }
}

//视频
function voip(m, i, msgArr) {
    if (m.content.includes('视频请求已在其它终端处理')) {
        m.type = '视频通话';
        testTime(m);
        if (m.direction == 'come') {
            m.direction = 'go';
            const _tS = m.sender;
            const _tSN = m.senderName;
            m.sender = m.receiver;
            m.senderName = m.receiverName;
            m.receiver = _tS;
            m.receiverName = _tSN;
        }
    }
    // "[图]23:26:01\n您中止了视频通话，通话时长58秒。"
    if (m.content.includes('您中止了视频通话，')) {
        m.type = '视频通话';
        testTime(m);
        if (m.direction == 'come') {
            m.direction = 'go';
            const _tS = m.sender;
            const _tSN = m.senderName;
            m.sender = m.receiver;
            m.senderName = m.receiverName;
            m.receiver = _tS;
            m.receiverName = _tSN;
        }
    }
    // 对方于3月14日22:47:42向您发起视频会话，由于您长时间未接听，该请求已取消。
    if (m.content.includes('向您发起视频会话')) {
        m.type = '视频通话';
        testTime(m);
        if (m.direction === 'go') {
            m.direction = 'come';
            const _tS = m.sender;
            const _tSN = m.senderName;
            m.sender = m.receiver;
            m.senderName = m.receiverName;
            m.receiver = _tS;
            m.receiverName = _tSN;
        }
    }

    if (['语音消息回复', '语音消息'].includes(m.content)) {
        m.type = '语音';
    }
}

function busy(m, i, msgArr) {
    if (m.content.includes('您好，我现在有事不在，一会再和您联系') && m.type != '忙') {
        m.type = '忙';
    }
}

function file(m, i, msgArr) {
    {
        const _type = '普通接收';

        // ########################### go

        // [图]22:37:07\n成功发送文件“荣耀无线上网帐号获取器1.5版.rar”(421.00KB)。 \n    \n
        fileRegMatch(m, /成功发送文件“(.+)”\((.+)\)/, () => directionExchange(m, 'go'));

        // [图]0:12:15\n成功接收文件 \n \n打开文件   打开所在文件夹 \n    \n
        fileRegMatch(m, /成功接收文件(“.+”){0,1}(\(.+\)){0,1}/, () => directionExchange(m, 'go'));

        // [图]13:38:01\n您拒绝接收“QQ2122041285.amr”(1.00KB)，文件传输失败。 \n    \n
        fileRegMatch(m, /您拒绝接收“(.+)”\((.+)\)/, () => directionExchange(m, 'go'));

        // [图]18:30:49\n您取消了“上帝是男孩.mp3”(7.50MB)的发送，文件传输失败。 \n
        fileRegMatch(m, /您取消了“(.+)”\((.+)\)的发送/, () => directionExchange(m, 'go'));

        // 您中止了“setup.rar”(664.00KB)的发送，该文件已经发送40.00KB。    再次发送
        fileRegMatch(m, /您中止了“(.+)”\((.+)\)的发送/, () => directionExchange(m, 'go'));

        // 网络连接失败，“20121102415.jpg”(643.00KB)发送中止，该文件已经发送0KB。    再次发送 \n'
        fileRegMatch(m, /网络连接失败，“(.+)”\((.+)\)发送中止/, () => directionExchange(m, 'go'));

        // [图]19:19:30 \n对文件“Desktop.rar”的操作发生异常，文件传输终止。 \n
        fileRegMatch(m, /对文件“(.+)的操作发生异常，/, () => directionExchange(m, 'go'));

        // ########################## come

        // [图]21:57:33\n对方中断了“Ifunbox.rar”(1.44MB)的接收，该文件已经发送235.00KB。 \n    \n
        fileRegMatch(m, /对方中断了“(.+)”\((.+)\)的接收/, () => directionExchange(m, 'come'));

        // [图]23:33:15\n对方拒绝接收“FormatFactory.rar”(47.41MB)，文件发送失败。 \n    \n
        fileRegMatch(m, /对方拒绝接收“(.+)”\((.+)\)/, () => directionExchange(m, 'come'));
    }

    {
        const _type = '离线文件';

        // ########################### go

        // [图]23:08:42\n成功接收离线文件“{1A7D8051-E530-CAF1-7A0E-B52E1A55E4DD}0.gif”(3.00KB) \n \n打开文件  打开所在文件夹 \n    \n\n[图]
        // name 和 size 不一定有
        fileRegMatch(m, /成功接收离线文件(“.+”){0,1}(\(.+\)){0,1}/, () => directionExchange(m, 'go'));

        // [图]22:43:57 \n您取消离线文件“33.gif”的发送，已发送770.00KB/8.03MB。    继续发送 \n
        fileRegMatch(m, /您取消离线文件“(.+)的发送.+\/(.+)。/, () => directionExchange(m, 'go'));

        // 17:34:57 \n您取消了离线文件“（๑ ❛ ϖ ❛ ๑）.vcf”(1.00KB)的接收，文件传输失败。 \n
        fileRegMatch(m, /您取消了离线文件“(.+)”\((.+)\)的接收/, () => directionExchange(m, 'go'));

        // ########################## come

        // [图]22:53:10\n对方已选择使用离线文件发送“微博桌面_4119236251l.jpg”(208.00KB)，在线文件传输取消。 \n    \n
        fileRegMatch(m, /对方已选择使用离线文件发送“(.+)”\((.+)\)/, () => directionExchange(m, 'come'));

        // [图]21:07:13\n对方已成功接收了您发送的离线文件“天猫砸金砖抓猫猫工具.exe.123”(3.47MB)。\n
        // 对方已成功接收了您发送的离线文件“T2avJvXdJMXXXXXXXX_!!59434910.jpg”(121.93KB)
        fileRegMatch(m, /对方已成功接收了您发送的离线文件“(.+)”\((.+)\)/, () => directionExchange(m, 'go'));

        // [图]0:20:17\n对方尝试向您发送离线文件“ennerson.rar”。该文件可能存在风险。  更改设置 \n    \n
        fileRegMatch(m, /对方尝试向您发送离线文件“(.+)”。该文件可能存在风险/, () => directionExchange(m, 'come'));

        // [图]22:50:56\n对方拒绝接收您发送的离线文件“新建文本文档 (3).txt”(3.00KB)。\n
        fileRegMatch(m, /对方拒绝接收您发送的离线文件“(.+)”\((.+)\)/, () => directionExchange(m, 'come'));

        // [图]23:05:30 \n对方取消在线传输，转为发送离线文件“KaWaYi.ttf”(12.70MB)。 \n
        fileRegMatch(m, /对方取消在线传输，转为发送离线文件“(.+)”\((.+)\)/, () => directionExchange(m, 'come'));
    }

    {
        const _type = '云端文件';

        // "13:40:50 \n文件“SuperSU-v2.76-CHS-Dave.zip”已成功保存至云端撤回该文件    到云端查看 \n"
        fileRegMatch(m, /文件“(.+)”已成功保存/, () => directionExchange(m, 'go'));

        // "[图]16:51:48\n文件 “IMG_0286.JPG”(247KB)已成功上传至服务器，我们将为您的好友保存 7 天。  \n    \n"
        fileRegMatch(m, /文件\s“(.+)”\((.+)\)已成功上传至服务器/, () => directionExchange(m, 'go'));

        // [图]21:56:16\n您中止了离线文件“Ifunbox.rar”(1.44MB)的发送，该文件已经发送0KB。    再次发送 \n    \n
        fileRegMatch(m, /中止了离线文件“(.+)”\((.+)\)的发送/, () => directionExchange(m, 'go'));
    }

    // 修复之前处理中额外添加的 html 元素
    if (m.html.includes('/qq-pc/file/')) {
        testTime(m);
        m.type = '文件';

        m.html = m.html
            .replace(
                /(<br>){0,1}<a href=".\/data\/qq-pc\/file\/(.+)" target="_blank" class="openFile">打开文件<\/a>/,
                '打开文件',
            )
            .replace(/<br><img src=".\/data\/qq-pc\/file\/.+">$/, '');
    }

    fixFileParse(m);
}

function fileRegMatch(m, reg, finFn) {
    if (!reg.test(m.content)) return;
    // if (m.type == '文件' || _.get(m, '$QQ.fileParse')) {
    //     console.warn('❌', '重复识别到 文件 类型, 正则匹配有重复', m);
    // }

    testTime(m);
    m.type = '文件';
    _.set(m, '$QQ.fileParse', {});
    try {
        let [str, name, size] = m.content.match(reg);
        if (name) name = name.replace(/^\“/, '').replace(/\”$/, '');
        if (size) size = size.replace(/^\(/, '').replace(/\)$/, '');
        if (name || size) {
            const { ext } = path.parse(name);
            _.set(m, '$QQ.fileParse', { name, size, ext: ext.toLowerCase() });
        }
    } catch (error) {
        console.log('error.message', error.message, m.content);
    }

    finFn && finFn(m);
}

function fixFileParse(m, i, msgArr) {
    if (_.get(m, '$QQ.fileParse') && !('base' in m.$QQ.fileParse)) {
        const { ext, name, base } = path.parse(m.$QQ.fileParse.name || '');
        m.$QQ.fileParse.ext = ext.toLowerCase();
        m.$QQ.fileParse.name = name;
        m.$QQ.fileParse.base = base;
        m.$QQ.fileParse.url = `./data/qq-pc/file/${encodeURIComponent(base)}`;
    }
    clearFileNameSpace(m);
}

const HAS_FILES = [];
const LOST_FILES = [];

function clearFileNameSpace(m) {
    if (_.get(m, '$QQ.fileParse.base')) {
        // 修复json和实际文件的文件名中的 0x0a 不间断空格
        // if (fs.existsSync(`${FILE_DIR_TARGET}/${f}`)) {
        const _f = _.get(m, '$QQ.fileParse.base', '');
        if (!_f) return;

        const f = clearStrSpace(_f);
        const find = FILES_ATTACHMENT.find(v => v.n == f);
        if (find) {
            _.set(m, '$QQ.fileParse.base', f);
            HAS_FILES.push(f);
            fs.copySync(path.join(FILE_DIR_TARGET, find.o), path.join(__dirname, '../dist/file/', f), {
                preserveTimestamps: true,
            });

            // 说明 json 中有不间断空格 ' ' ，需要修复
            if (_f.includes(String.fromCharCode('0xa0'))) {
                m.$QQ.fileParse.base = clearStrSpace(m.$QQ.fileParse.base);
                m.$QQ.fileParse.name = clearStrSpace(m.$QQ.fileParse.name);
                m.$QQ.fileParse.url = `./data/qq-pc/file/${encodeURIComponent(m.$QQ.fileParse.base)}`;

                console.warn('❌', '不间断空格 "%C2%A0" 需要测试', f, m.day, m.time);
            }
        } else {
            LOST_FILES.push([`${m.day} ${m.time}`, f]);
        }
    }
}

function clearStrSpace(str) {
    return str.replace(/\s/g, ' ');
}

function testTime(m, i, msgArr) {
    try {
        let t = m.content.match(/\d{1,2}:\d{2}:\d{2}/);
        if (!t) {
            // 对方已成功接收了您发送的离线文件“TB261XmrsuYBuNkSmRyXXcA3pXa_!!0-rate.jpg_400x400.jpg”(24.92KB)。
            // 可能文件类型没有时间
            return;
        }
        t = t.toString();
        const ms = dayjs(`${m.day} ${t}`).valueOf();
        // 正负 1s 内都是合理的
        if (ms > m.ms + 1000 || ms < m.ms - 1000) {
            console.warn('❌', 'Time not same', m, ms, m.ms);
        }
    } catch (error) {
        console.log('t', m);
        throw new Error();
    }
}

function face(m, i, msgArr) {
    // 删除 sysface 属性
    m.html = m.html.replace(/(?<=<img src=".\/data\/qq-pc\/face\/.+")( sysface="\d+")(?= alt=)/, '');

    const $ = cheerio.load(m.html, { decodeEntities: false }, null);
    const imgs = $('img');
    let count = 0;
    Array.from(imgs).forEach(img => {
        const { src } = img.attribs;
        if (src.startsWith('lostImg_')) return;

        const { name } = path.parse(src);

        // 这个是点击图片显示 其实应该是图片错误 直接修改成[错误]的图片
        if (name == 'dc5ede7b03528d416d76100bef428a8d') {
            img.attribs.src = `./data/qq-pc/2180ee73c1c30b6604c98102af9a844e.png`;
            count++;
            return;
        }
        const find_face = FACE_ARR.reduce((pre, cV) => {
            if (pre) return pre;

            // alias匹配的也是返回 alias 的父对象
            const inFiles = cV.files.find(f => f.md5 == name || (f.alias && f.alias.some(f_a => f_a.md5 == name)));
            return inFiles ? { type: cV.type, alt: cV.alt, file: inFiles } : false;
        }, null);

        // 先看在不在 face 里面
        if (find_face) {
            // 表情处理 注意 fixText 函数中的 img html 硬编码 attribute
            img.attribs.alt = `${find_face.type}-${find_face.alt}`;
            img.attribs.title = img.attribs.alt;
            img.attribs.src = `./data/qq-pc/face/${find_face.type}/${find_face.file.md5}${find_face.file.ext}`;
            count++;
            return;
        } else {
            // 如果属于图片就删掉 alt (之前可能被认为是表情所以加了 alt)
            const find_img = IMG_ARR.find(f => f.md5 == name);
            if (find_img) {
                delete img.attribs.alt;
                img.attribs.src = `./data/qq-pc/img/${find_img.md5}${find_img.ext}`;
                count++;
                return;
            } else {
                console.log('异常的图片', name);
            }
        }

        console.warn('❌', '没有找到图片', name);
    });

    if (count > 0) {
        m.html = $.html();
    }

    m.content = htmlToText(m.html);
}
function text(m, i, msgArr) {
    // 修复 mht 生成的 bug
    m.content = m.content.replace(/&get;/gim, '>');
    m.html = m.html.replace(/&get;/gim, '&gt;');

    if (/\f/.test(m.content)) {
        m.content = m.content.replace(/\f/gm, '\n');
    }

    if (/\f/.test(m.html)) {
        m.html = m.html.replace(/\f/gm, '<br>');
    }

    if (/发送了一个窗口抖动/.test(m.content)) {
        // 只需要处理 go 也就是我的情况  其余的都是 come

        // go--> [图]17:33:47\n您发送了一个窗口抖动。
        // come--> [图]14:19:49\n|对方昵称-不固定|给您发送了一个窗口抖动。

        // if (/\d{1,2}:\d{2}:\d{2}\s您发送了一个窗口抖动。/.test(m.content)) {
        //     directionExchange(m, 'go');
        // }
        // // [图]您发送了一个窗口抖动。
        // else if (/\[图\]您发送了一个窗口抖动/.test(m.content)) {
        //     directionExchange(m, 'go');
        // } else {
        //     console.warn('❌', '疑似的窗口抖动|', m);
        // }

        // 好像区别就是这个 "给" 字
        if (/给您发送了一个窗口抖动/.test(m.content)) {
            directionExchange(m, 'come');
        } else {
            directionExchange(m, 'go');
        }
    }
    fixText(m);
}

function fixText(m) {
    // '2011/8/15 上午12:00:00' -> '2011/12/31 下午11:59:59'
    if (m.ms >= 1313337600000 && m.ms <= 1325347199000) {
        // 修复腾讯的bug,可能会导致误操作. 详情参看 GET-QQ-Mht-HtmlToJson
        m.content = replaceAll(m.content, '[QQ经典-抠鼻]?', '[QQ经典-委屈]');
        // 注意 face 函数中给 img 添加的 attribs
        m.html = replaceAll(
            m.html,
            `<img src="./data/qq-pc/face/QQ经典/f5432912e00d178e650e0516d2773047.gif" alt="QQ经典-抠鼻" title="QQ经典-抠鼻"><font style="font-size:9pt;font-family:'宋体','MS Sans Serif',sans-serif;" color="000000">?`,
            `<img src="./data/qq-pc/face/QQ经典/694d0a02cef6435699aeeef3fa04bedc.gif" alt="QQ经典-委屈" title="QQ经典-委屈"><font style="font-size:9pt;font-family:'宋体','MS Sans Serif',sans-serif;" color="000000">`,
        );

        // 。? -> ～
        m.content = replaceAll(m.content, '。?', '～');
        m.html = replaceAll(m.html, '。?', '～');
    }
}

/**
 * @name: 给 QQ 消息增加图片类型
 * @description:
 * @param {*} m
 * @return {*}
 */

const notImgTypeMd5Arr = [
    '05a7e60163b30cd8e0e47e79845de8c3',
    '0cb866c62b0a96b74be882958c79a463 ',
    '1cb042c1305c4593e148c3fbc3064c63',
    '224081b8537dbc66d192595a0d995ad7',
    '468c7f831f004712ab9fa10affa035f0',
    '4b47a2f4d525aad193ff65ad9a1623fb',
    '628073687d13f7a0f5694acd247be7f7',
    '6bd4c01ad40374e5a9be741808fe2748',
    '71fdaa878f30a2527be5c4cb64661de4',
    '75c76a5dac4aad478d1bb5948ea1dc32',
    '819402242c1f49b7300a1f560a5c02c4',
    '891ed913a1a3a9781bde2fd3c6fafd10',
    '93ecf0f47986f49782e7609681b60380',
    '9c749c221eb14c0cbcddc3345bfe02ea',
    'a3116028d605873eed48bcd99b947581',
    'a731ec7b8374adec5f2f141ecb0f9688',
    'ad64e423e630a7c418520c8e8ce5f8a1',
    'b33ed64c992c47591ebcb82ff551949c',
    'b5be7a15d8e29a36f5d6cca011564957',
    'b606cd6c1bfb3ac46a7868d4a37c88f3',
    'da91e3414b1ec43bf12209c2b98e9d2f',
    'e6106e8e22732710e691539e4e445873',
    'e6c37cfb8d02d04d618e1a4541cf214f',
];

function image(m) {
    if (m.type !== '消息') return;
    const $ = cheerio.load(m.html, { decodeEntities: false }, null);
    const imgs = $('img').filter((i, n) => {
        const { src, alt, title } = n.attribs;

        return (
            src.includes('/data/qq-pc/img/') &&
            !notImgTypeMd5Arr.some(md5 => md5 === path.parse(src).name.toLowerCase())
        );
    });
    if (imgs.length > 0) m.type = '图片';
}

module.exports = {
    directionCheck,
    voip,
    busy,
    file,
    face,
    text,
    image,
    HAS_FILES,
    LOST_FILES,
};

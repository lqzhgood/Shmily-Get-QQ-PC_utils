const cheerio = require('cheerio');

module.exports.directionExchange = function (m, d) {
    if (m.direction == d) return;
    const { sender, senderName, receiver, receiverName } = m;

    m.direction = d;
    m.sender = receiver;
    m.senderName = receiverName;
    m.receiver = sender;
    m.receiverName = senderName;
};

module.exports.htmlToText = function (html) {
    const $ = cheerio.load(html, { decodeEntities: false });
    $('img').replaceWith((i, elm) => {
        const { alt } = elm.attribs;
        return `<span>${alt ? `[${alt}]` : '[图]'}</span>`;
    });
    $('br').replaceWith((i, elm) => {
        return `<span>\n</span>`;
    });

    return $.text();
};

module.exports.replaceAll = function (str, key, replacement) {
    let _str = str;
    while (_str.includes(key)) {
        _str = _str.replace(key, replacement);
    }
    return _str;
};

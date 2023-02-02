const path = require('path');

const config = {
    // 执行 \data\qq-pc\face\merger.js 后产生
    FACE_FILE: path.resolve('E:/Shmily/Tool/Show/msgData/data/qq-pc/face/emojiMapByQQ.json'),

    MSG_JSON_FILE: path.join(__dirname, './input/msg-qq-pc-mht.json'),
    IMG_DIR: path.join(__dirname, './input/data/qq-pc/img/'),
    FILE_DIR: path.resolve('./input/data/qq-pc/file/'),

    // go 我的 QQ 号码
    MN: ['123'],
    // go 我的 QQ 昵称
    M: ['name'],

    // come 对方的 QQ 号码
    YN: ['234', '464'],
    // come 对方的 QQ 昵称
    Y: ['name'],
};

module.exports = config;

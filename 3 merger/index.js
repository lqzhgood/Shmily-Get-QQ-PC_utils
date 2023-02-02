const fs = require('fs');

const all = require('./1-e-fixName');
const copy = require('./qq_rich_copy_msg-e-fixHtml');

const all_h = require('../1 slice/1-h');
const copy_h = require('../1 slice/qq_rich_copy_msg-h');

const all_f = [].concat(all_h, all);
const copy_f = [].concat(copy_h, copy);

fs.writeFileSync('./1_f.json', JSON.stringify(all_f, null, 4));
fs.writeFileSync('./copy_f.json', JSON.stringify(copy_f, null, 4));

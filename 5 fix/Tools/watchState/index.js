const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// const files = fs
//     .readdirSync('./input/')
//     .filter(_f => !fs.statSync(path.join(__dirname, './input', _f)).isDirectory())
//     .map(_f => {
//         const f = path.join(__dirname, './input', _f);

//         const { name, ext } = path.parse(f);
//         const { size } = fs.statSync(f);

//         return {
//             md5: name,
//             ext,
//             size,
//         };
//     });

fs.watch('./input', (event, _f) => {
    const f = path.join(__dirname, './input', _f);

    if (!fs.existsSync(f)) return;
    if (fs.statSync(f).isDirectory()) return;

    const { name, ext } = path.parse(f);
    const { size } = fs.statSync(f);

    console.log('event', event);
    const md5 = crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

    if (fs.existsSync(f)) fs.renameSync(f, `./input/${md5}${ext}`);

    console.log(
        JSON.stringify(
            {
                alias: [
                    {
                        md5,
                        ext,
                        size,
                    },
                ],
            },
            null,
            4,
        ),
    );
});

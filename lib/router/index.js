'use strict';
//express_demo.js 文件

require('babel-register');
const Wechat = require('../wechat.js');
const qrcode = require('qrcode-terminal');
var bot = null,
    uuidG;
bot = new Wechat();
bot.start();
bot.on('uuid', uuid => {
    qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
        small: true
    });
    uuidG = uuid;
    // res.status(200).send('二维码链接：', 'https://login.weixin.qq.com/qrcode/')
    console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid);
});

module.exports = function (app, io) {
    io.on('connection', socket => {
        require('../msgSocket/msg.js')(bot, socket, app);

        socket.on('msg', msgData => {
            console.log('客户端消息：' + msgData);
        });
        console.log('server recive');
    });

    app.get('/', (req, res) => {
        res.render('index', { src: 'https://login.weixin.qq.com/qrcode/' + uuidG });
        // res.redirect('https://login.weixin.qq.com/qrcode/' + uuid)
    });
};
//# sourceMappingURL=index.js.map

var sysMsg = {
    type: 'img',
    content: {}
};

module.exports = function (bot, socket, app) {
    bot.on('user-avatar', avatar => {
        sysMsg.content.txt = avatar;
        socket.emit('sysMsg', sysMsg);
        console.log('登录用户头像已扫描二维码');
    });

    bot.on('error', err => {
        console.error('错误：', err);
    });
};
//# sourceMappingURL=msg.js.map
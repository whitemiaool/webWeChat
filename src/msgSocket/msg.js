require('babel-register')
const Wechat = require('../wechat.js');
const qrcode = require('qrcode-terminal');
var bot = null,uuidG=[];
// bot = new Wechat();
var sysMsg = {
    type:'img',
    content:{},
}

module.exports = function(bot1,socket,app) {

    try {
        bot = new Wechat(uuidG[0])
    } catch (e) {
        bot = new Wechat()
    }

    if (bot.PROP.uin) {
    // 存在登录数据时，可以随时调用restart进行重启
        bot.restart()
    } else {
        bot.start()
    }

    bot.on('login', () => {
        console.log('登录成功')
        uuidG.push(JSON.stringify(bot.botData))
        socket.emit('sysMsg',JSON.stringify({type:'logVictory'}))
    })

/**
 * 联系人更新事件，参数为被更新的联系人列表
 */
    bot.on('contacts-updated', contacts => {
        console.log(contacts)
        console.log('联系人数量：', Object.keys(bot.contacts).length)
    })

    bot.on('user-avatar', avatar => {
        sysMsg.content.txt = avatar;
        socket.emit('sysMsg',JSON.stringify(sysMsg)); 
        console.log('登录用户头像已扫描二维码');
    })

    socket.on('msg',(msgData)=>{
        console.log('客户端消息：'+msgData)
    })

    bot.on('error', err => {
        console.error('错误：', err)
        socket.emit('sysMsg',JSON.stringify({type:'err',content:{"err":err}}));
    })

    bot.on('uuid', (uuid) => {
        qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
        small: true
        })
        socket.emit('sysMsg',JSON.stringify({type:'qr',content:{src:'https://login.weixin.qq.com/qrcode/'+uuid}}))
        // socket.emit('sysMsg',{type:'qre'})
        console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
    });
}
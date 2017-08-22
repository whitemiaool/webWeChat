'use strict'
//express_demo.js 文件

module.exports = function(app,io) {
    io.on('connection',(socket)=>{
        require('../msgSocket/msg.js')(null,socket,app);
        socket.emit('sysMsg',{test:'test'})
        console.log('server recive')
    })

    app.get('/',(req,res)=>{
        res.render('index')
        // res.redirect('https://login.weixin.qq.com/qrcode/' + uuid)
    })
}
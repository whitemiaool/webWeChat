// console.log('dyxuan')
var socket = io('//localhost:3123');

socket.on('open',()=>{
    console.log('connection created')
})

socket.emit('msg','fuck');

socket.on('sysMsg',(data)=>{
    console.log('data',data);
    try {
        if(typeof data === 'string')
            data = JSON.parse(data);
        switch(data.type) {
            case 'qr': getLoginQr(data);break;
            case 'img': userSureLogin(data);break;
            case 'logVictory':loginSuccess(data);break;
            case 'err':getError(data);break;
            default: console.log('未识别的数据'+JSON.stringify(data)); break;
        }
    } catch(e) {
        console.log(e)
    }
})

function getLoginQr(data) {
    $('body').html('');
    $('body').append(`<div class="sys-msg login-qr">拿上你的爪机扫描屏幕中间的二维码<img src=${data.content.src} ></img></div>`)
}

function userSureLogin(data) {
    $('body').html('');
    $('body').append(`<h2 class="sys-msg sure-login">已扫描，请确认登录</h2><img src=${data.content.txt}/>`)
}

function loginSuccess(data) {
    $('body').html(`<h2 class="sys-msg login-success">登录成功</h2>`)
}

function getError(data) {
    $('body').html('');
    $('body').append(`<h2 class="sys-msg get-err">获取数据失败...请刷新页面</h2>`)
}

socket.on('disconnect',(message)=>{
    console.log('断开连接'+message);
})

socket.on('error',(e)=>{
    console.log('error:'+e);
    location.reload();
})

// console.log(socket);
// console.log('dyxuan')
var socket = io('//localhost:3000');

socket.on('open',()=>{
    console.log('connection created')
})

socket.emit('msg','fuck');

socket.on('sysMsg',(data)=>{
    
    switch(data.type) {
        case 'img': $('iframe').remove();$('body').append(`<img src=${data.content.txt}/>`)
    }
    console.log(data)
})

console.log(socket);
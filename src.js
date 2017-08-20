'use strict'
//express_demo.js 文件
require('babel-register')
var express = require('express');
var path = require('path')
var app = express();

var http=require('http').Server(app);
var io=require('socket.io')(http);



app.use(express.static('public'));
// app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));  
app.set('view engine', 'ejs');


 
var server = http.listen(3000, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
 
})

require('./src/router/index.js')(app,io);


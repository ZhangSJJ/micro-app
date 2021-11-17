/**
 * Created by sjzhang on 2017/5/8.
 */
var app = require('./ApiServer/apiServer');
var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(4001, function () {
	console.log('listening on *:4001');
});

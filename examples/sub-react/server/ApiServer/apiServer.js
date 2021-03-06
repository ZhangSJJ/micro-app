/**
 * Created by sjzhang on 2017/4/8.
 */
var express = require('express');
var bodyParser = require('body-parser');
const path = require('path')

var apiServer = express();
// parse application/json
apiServer.use(bodyParser.json());
//parse application/x-www-form-urlencoded,extended为false表示使用querystring来解析数据，这是URL-encoded解析器
apiServer.use(bodyParser.urlencoded({ extended: false }));

///=======路由信息 （接口地址）开始 存放在./routes目录下===========//
var users = require('./routes/User/users'); //用户接口
apiServer.use('/users', users);//在app中注册users接口
console.log(path.resolve(__dirname, '../../build'))
let options = {
    setHeaders: function (res, path, stat) {
        res.set('Access-Control-Allow-Origin', '*')
    }
}
apiServer.use("/public", express.static(path.resolve(__dirname, '../../build'), options));

module.exports = apiServer;

var fs = require('fs');
var db_config_file = '/whiteboard/configurations/db_configuration.json';
var obj = JSON.parse(fs.readFileSync(db_config_file, 'utf8'));
var connect = "mongodb://";
connect += obj.host;
connect += ':';
connect += obj.port;
connect += '/';
connect += obj.name;

var config = {};


//debug config
config.CLEANUP_TIMER = 120000;
config.ELAPSED_TIMER = 900000;
config.HTTPS_PORT = 4575;
config.SOCKET_PORT = 4576;

config.SERVER_KEY = './ssl/server-key.pem';
config.SERVER_CERTIFICATE = './ssl/server-crt.pem';
config.CA_KEY = './ssl/ca-crt.pem';

config.AUTH_FAILURE = 'AUTHENTICATION FAILURE';
config.NOT_FOUND = 'NOT_FOUND';

config.HTTPS_PATH = '/session';


config.POST_CONNECT = "http://ec2-54-213-212-157.us-west-2.compute.amazonaws.compute/api/tutoring/whiteboardsessionuserjoined";
config.POST_DISCONNECT = "http://ec2-54-213-212-157.us-west-2.compute.amazonaws.compute/api/tutoring/whiteboardsessionterminated";

config.DB_URL = connect;
config.DB_USER = obj.user;
config.DB_PASS = obj.password;

config.POST_TIMER = 60000;

config.serviceid = "WHITEBOARD";
config.servicekey = "YsVlxetEvInZWsehQdwTT6yxHSCbETVF3uKL9zk6GNNdDcqhZqH81tuwSFJjPQ2";
module.exports = config;
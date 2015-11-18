var fs = require('fs');
var file = '/whiteboard/configurations/db_configuration.json';
var obj = JSON.parse(fs.readFileSync(file, 'utf8'));

var connect = "mongodb://";
connect +=obj.user;
connect += ':';
connect += obj.password;
connect += '@';
connect += obj.host;
connect += ':';
connect += obj.port;
connect += '/';
connect += obj.name;


console.log(connect);

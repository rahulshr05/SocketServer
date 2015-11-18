var fs = require('fs');  
var https = require('https');

var options = {  
    hostname: 'localhost',
    port: 4575,
    path: '/createsession',
    method: 'GET',
    key: fs.readFileSync('../ssl/client1-key.pem'),
    cert: fs.readFileSync('../ssl/client1-crt.pem'),
    ca: fs.readFileSync('../ssl/ca-crt.pem'),
    headers: {
     'Authorization': 'Basic ' + new Buffer('rahul' + ':' + 'mactix87@wschalk').toString('base64')
   }   
};

var req = https.request(options, function(res) {  
    res.on('data', function(data) {
        process.stdout.write(data);
      });
  });
req.end();  

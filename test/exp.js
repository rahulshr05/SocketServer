var http = require('http');
var qs = require('querystring');

var server = http.createServer(function(req,res){
	if(req.method === 'POST'){
		var body = '';
		req.on('data',function(data){
			body+=data;
			if (body.length > 1e6)
                req.connection.destroy();
		})
		req.on('end', function () {
            var post = qs.parse(body);
            console.log(post);
            console.log(post['session_id']);
        });
	}
	res.end('It Works!! Path Hit: ' + req.url);
});

server.listen(8888,function(){
	console.info("Server Running at 8888");
})
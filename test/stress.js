var WebSocketClient = require('websocket').client;
var k=0;
for (var i = 0; i<10000; i++)
{
	var client = new WebSocketClient();
	setTimeout(foo,10000);
	client.on('connectFailed', function(error) {
	    console.log('Connect Error: ' + error.toString());
	});

	client.on('connect', function(connection) {
	    console.log('WebSocket Client Connected');
	    setTimeout(foo,10000);
	    connection.on('error', function(error) {
	        console.log("Connection Error: " + error.toString());
	    });
	    connection.on('close', function() {
	        console.log('echo-protocol Connection Closed');
	    });
	    connection.on('message', function(message) {
	        if (message.type === 'utf8') {
	            console.log("Received: '" + message.utf8Data + "'");
	        }
	    });

	    function sendNumber() {
	        if (connection.connected) {
	            var number = Math.round(Math.random() * 0xFFFFFF);
	            connection.sendUTF(number.toString());
	            setTimeout(sendNumber, 10000);
	        }
	    }
	    sendNumber();
	});

	client.connect('ws://localhost:4000?SessionId=' + k, 'echo-protocol');
	if (i%2 == 0){
		k+=1;
	}
	
	function foo()
	{}

	
}
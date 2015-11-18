var https = require('https');
var fs = require('fs');
var request = require('request');
var pwd = require(__dirname + '/pwd.js');
var mongoose = require('mongoose');
var winston = require('winston');
var qs = require('querystring');

var config;
var logger;
var count = 0;
var args = process.argv.slice(2);
var constants = require(__dirname + '/appconstant.js');

switch (args[0]) {
    case "debug":
        config = require(__dirname + '/config/config_debug.js');
        break;
    case "stage":
        config = require(__dirname + '/config/config_stage.js');
        break;
    case "prod":
        config = require(__dirname + './config/config_prod.js');
        break;
    default:
        console.log("Specify the environment value (prod/stage/debug)");
        process.exit(0);
        break;
}

//Setting up logging
if(args[1] == null){
    logger = new(winston.Logger)({
        transports: [
            new (winston.transports.Console)()
        ]
    });

}
else{
    logger = new(winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: args[1] })
        ]
    });
}

//DB connection
mongoose.connect(config.DB_URL,
    {user:config.DB_USER, pass:config.DB_PASS},
    function(err){
        if (err) {throw err;}
        logger.info("DB connected...");
});

var SessionInfo = require('./db/models/sessionInfo.js');
var PostConnect = require('./db/models/postConnect.js');
var PostDisconnect = require('./db/models/postDisconnect.js');
var StoreMessageToDB = require('./db/models/message.js');
var ValidUsers = require('./db/models/validUsers.js');

var http = require("http");
var WebSocketServer = require('websocket').server;

var sessionMap = {};
var sessionStartTime = {};


var options = {
    key:                fs.readFileSync(config.SERVER_KEY),
    cert:               fs.readFileSync(config.SERVER_CERTIFICATE),
    ca:                 fs.readFileSync(config.CA_KEY),
    requestCert:        true,
    rejectUnauthorized: true
};

function generateSession(){
    var id = mongoose.Types.ObjectId();
    sessionMap[id] = [];
    sessionStartTime[id] = new Date();

    initSessionInfoToDB(id);

    console.log('Session  ' + id);
    var json = JSON.stringify({
                "session_id": id
    });

    return json;
}

function initSessionInfoToDB(id){
    var newSession = new SessionInfo({
        session_id : id,
        start_time : new Date()
    });

    //saving new session info in Db
    newSession.save(function(err){
        if (err) {throw err;}
        logger.info("Session ID: %s sessioninfo stored",id.toString());
    });
}


var srvr = https.createServer(options,function(request,response){
    if(request.url === config.HTTPS_PATH && request.method == 'POST'){
        var header = request.headers['authorization']||'',        // get the header
          token = header.split(/\s+/).pop()||'',            // and the encoded auth token
          auth = new Buffer(token, 'base64').toString(),    // convert from base64
          parts = auth.split(/:/),                          // split on colon
          username = parts[0],
          password = parts[1];
        var postData;
        if(pwd.verifyUser(username,password)){
            var body = '';
            request.on('data',function(data){
                body += data;
            });
            request.on('end',function(){
                postData = qs.parse(body);
            })
            response.writeHead(200, {"Content-Type": "text/html"});
            var id  = generateSession();
            response.end(id);
        }
        else{
            response.end(constants.AUTH_FAILED);
        }
    }
    else{
          response.end(constants.SERVER_NOT_FOUND);
    }
});

srvr.listen(config.HTTPS_PORT,function(){
        logger.info("HTTPS Server is listening on port: %d", config.HTTPS_PORT);
});


//Web Socket server code
var server = http.createServer(function(request, response){
    response.end(constants.SERVER_NOT_FOUND);
});

server.listen(config.SOCKET_PORT, function(){
    logger.info("Socket server is listening on port: %d", config.SOCKET_PORT);
});


var wsServer = new WebSocketServer({
    httpServer: server
});


function isValidUser(userId,sessionId){
    var users;
    ValidUsers.findOne({'session_id':sessionId}, function(err,doc){
        if (err) {throw err;}
        users = doc.users;
    });
    if (users != null && users.indexOf(userId) > -1){
        return true;
    }
    return false;
}

wsServer.on('request', function(request) {
    count+=1;
    logger.info("Connection count: %d", count);

    var params = request.resource.split("?")[1].split("&");

    var sessionId = params[0].split('=')[1];
    var userId = params[1].split('=')[1];
    var userType = params[2].split('=')[1];

    logger.info("UserID:%s UserType:%s sessionID:%d",userId,userType,sessionId);


  //Remove this code after local testing
    if (!(sessionId in sessionMap)){
        sessionMap[sessionId] = [];
        sessionStartTime[sessionId] = new Date();
    }

    if (!isValidUser(userId,sessionId)) {
        request.reject();
        logger.info("Session ID: %d rejected",sessionId);
        return;
    }

    updateSessionInfo(sessionId,userId,userType);
    console.log(request.requestedProtocols);
    var connection = request.accept('echo-protocol', request.origin);
    logger.info("%s joined the session",connection.remoteAddress);

    sessionMap[sessionId].push(connection);

    connection.on('message', function(message){
      //broadcast the messages
        if (sessionMap[sessionId] !== null && sessionMap[sessionId].length > 1){
            sessionMap[sessionId].forEach(function(client){
              if(connection != client){
                  if (message.type === 'utf8') {
                      //console.log('Received Message: ' + message.utf8Data);
                      client.send(message.utf8Data);
                  }
                  else if (message.type === 'binary') {
                      //console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                      client.send(message.binaryData);
                  }
              }
            });
        }
    });

    connection.on('close', function(reasonCode, description){
        logger.info("%s disconnected",connection.remoteAddress);
        //logger.info("Session %s ended",sessionId);
        //sessionMap[sessionId] = [];
        //sessionEnded(sessionId);
        //delete sessionMap[sessionId]; //deleting session from the map
        var index = sessionMap[sessionId].indexOf(connection);
        if (index > -1){
            sessionMap[sessionId].splice(index, 1);
        }
        sessionMap[sessionId].forEach(function(client){
            client.sendUTF('disconnect');
            //var num = 100;
            //client.sendBytes(num.toString(2));
            //console.log("Dsconnected....");
        });

        SessionInfo.update({session_id : sessionId},
            {$set:
                {end_time : new Date()}
            },
            {safe: true, upsert: true},
            function(err,model){
                if (err) {throw err;}
                logger.info("Session id: %d updated in DB", sessionId);
        });

    });

});

function updateSessionInfo(sessionId,userId,userType)
{
    userConnected(sessionId,userId,userType)

    SessionInfo.update({session_id : sessionId},
        {$addToSet: {users :
            {user_id : userId,
            user_type : userType,
            joined_time : new Date()}
        }},
        {safe: true, upsert: true},
        function(err,model){
            if (err) {throw err;}
            logger.info("Session id: %d updated in DB", sessionId);
    });

}

//This function will take care of cleaning of rogue sessions
setInterval(function(){
    logger.info('Running cleanup operations');
    for( var key in sessionMap){
        var elapsedTime = new Date() - sessionStartTime[key];
        if ((sessionMap[key] === null || sessionMap[key].length <= 1) && elapsedTime > config.ELAPSED_TIMER){
            logger.info("Cleaning up session %d",key);
            delete sessionMap[key];
        }
    }
},config.CLEANUP_TIMER);

function cleanupPostRequest(){
    logger.info('Checking DB for failed requests');
    PostConnect.findOne({},function(err,result){
        if (result !== null && !result.flag){
            PostConnect.findOneAndRemove({session_id : result.session_id},function(err){
                if (err) {throw err;}
                logger.info("Cleaning up failed post connect request");
            });
            userConnected(result.session_id,result.user_id,result.user_type);
        }
    });

    PostDisconnect.findOne({},function(err,result){
        if (result !== null && !result.flag){
            PostDisconnect.findOneAndRemove({session_id : result.session_id},function(err){
                if (err) {throw err;}
                logger.info("Cleaning up failed post disconnect request");
            });
            sessionEnded(result.session_id);
        }
    });
}

//Another timer for making post connect/disconnect calls
setInterval(function(){
    logger.info('Updating status flag');
    PostConnect.update({flag : true}, {flag : false}, function(err){
        if (err) {throw err;}
    });
    PostDisconnect.update({flag : true}, {flag : false}, function(err){
        if (err) {throw err;}
    });
    cleanupPostRequest();

},config.POST_TIMER);


function userConnected(sessionId,userId,userType){

    var options = {
        url: config.POST_CONNECT,
        method: 'POST',
        headers: {
            'serviceid'  : config.serviceid,
            'servicekey' : config.servicekey
        },
        form: {
            'session_id' : sessionId,
            'user_id'    : userId,
            'user_type'  : userType
        }
    }

    request(options,function(err,res,body){
        if (err || res.statusCode !== 200){
            var failedSession = new PostConnect({
                session_id : sessionId,
                user_id : userId,
                user_type : userType,
                flag : true
            });
            failedSession.save(function(err){
                if (err) {throw err;}
               // logger.info("[session id: %d] Store failed connect post call", sessionId);
            });

        }
        cleanupPostRequest();
    });
}


function sessionEnded(sessionId){

    var options = {
        url: config.POST_CONNECT,
        method: 'POST',
        headers: {
            'serviceid'  : config.serviceid,
            'servicekey' : config.servicekey
        },
        form: {
            'session_id' : sessionId
        }
    }

    request(options,function(err,res){
        if (err || res.statusCode !== 200){
            var failedSession = new PostDisconnect({
                session_id : sessionId,
                flag : true
            });
            failedSession.save(function(err){
                if (err) {throw err;}
           //     logger.info("[session id: %d] Store failed disconnect post call",sessionId);
            });
        }
        cleanupPostRequest();
    });
}

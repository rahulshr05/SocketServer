var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var disconnectSchema = new Schema({
	session_id : String,
	flag : Boolean
});

var postDisconnect = mongoose.model('PostDisconnect', disconnectSchema);

module.exports = postDisconnect;
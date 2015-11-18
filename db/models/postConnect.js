var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var connectSchema = new Schema({
	session_id : String,
	user_id : String,
	user_type : String,
	flag : Boolean
});

var postConnect = mongoose.model('PostConnect', connectSchema);

module.exports = postConnect;


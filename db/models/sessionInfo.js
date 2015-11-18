var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionSchema = new Schema({
	session_id : String,
	users : [{
		_id : false,
		user_id : String,
		user_type : String,
		joined_time : Date
	}],
	start_time : Date,
	end_time : Date
});


var SessionInfo = mongoose.model('SessionInfo', sessionSchema);

module.exports = SessionInfo;

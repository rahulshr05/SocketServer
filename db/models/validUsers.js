var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	session_id : String,
	users : [{
		_id : false,
		user_id : String
	}]
});

var validUsers = mongoose.model('ValidUsers', userSchema);

module.exports = validUsers;

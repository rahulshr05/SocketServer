var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    session_id : String,
    message_type : String,
    data : String
});

var dbMessage = mongoose.model('DBMessage', messageSchema);
module.exports = dbMessage;
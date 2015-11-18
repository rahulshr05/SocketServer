var bcrypt = require('bcrypt');

var salt = bcrypt.genSaltSync(10);

exports.verifyUser = function(username,password){
	for (var key in USER_IDS){
		if (key == username){
			return bcrypt.compareSync(password,USER_IDS[key]);
		}
	}
	return false;
}

var USER_IDS = {
  "rahul" : "$2a$10$UXG5kYyf47Fa3NEmymm0t.wGozgvSGRGPGV.jQfbCjbovEkIdnGXC"
};


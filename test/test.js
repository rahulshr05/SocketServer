var bcrypt = require('bcryptjs');

var cred = {};

var salt = bcrypt.genSaltSync(10);

var password = 'mactix87@wschalk'
var hash = bcrypt.hashSync(password,salt);
console.log(hash);


//BEGINLINEDRAWING,
//DRAWLINE,
//ENDLINEDRAWING,
//ERASELINE,
//COLORCHANGE,
//CLEARSCREEN,
//WIDTHCHANGE,
//PENCHANGE,
//CHANGEBACKGROUND,
//SCREENSIZEINFO,
//SCREENMOVED,
//VIEWPORTMOVED,
//CHATMESSAGE
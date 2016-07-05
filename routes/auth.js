// User authentication
var jwt = require('jwt-simple');
 
var auth = {
	init: function(ini) {
		// TODO: load secret and expiration time
	},
	
	login: function(req, res) {
		var username = req.body.username || '';
		var password = req.body.password || '';
		
		// Invalid credentials
		if (username == '' || password == '') {
			res.status(401);
			res.json({
				"status": 401,
				"message": "Invalid credentials"
			});
			return;
		}
 
		// Check if credentials are valid
		var dbUserObj = auth.validate(username, password);
   
		 // Authentication fails
		if (!dbUserObj) {
			res.status(401);
			res.json({
				"status": 401,
				"message": "Invalid credentials"
			});
			return;
		}
 
		// Authentication succeed
		if (dbUserObj) {
			// If authentication is success, we will generate a token
			// and dispatch it to the client
			res.json(generateToken(dbUserObj));
		}
	},
 
	// Validate user/password
	validate: function(username, password) {
		// TODO: check in DB
		if (username != "admin" || password != "admin") {
			return null;
		}
		
		// Return user
		var dbUserObj = {
			name: 'admin',
			username: 'admin@lespot-bouygues.com'
		};

		return dbUserObj;
	}
}
 
// private method
function generateToken(user) {
	var dateObj = new Date();
	var expires = dateObj.setDate(dateObj.getDate() + 7); // TODO: should be in .INI file
	var token = jwt.encode({
		exp: expires
	}, "secret"); // TODO: should be in .INI file

	return {
		token: token,
		expires: expires,
		user: user
	};
}
 
module.exports = auth;
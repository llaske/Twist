// User authentication
var jwt = require('jwt-simple');

var secret = '';
var expires = 0;

var auth = {
	init: function(ini) {
		secret = ini.auth.secret;
		expires = ini.auth.expires;
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
			// Generate a token and dispatch it to the client
			res.json(generateToken(dbUserObj));
		}
	},
 
	// Validate user/password
	validate: function(username, password) {
		// TODO: check in DB
		if (username != "admin@lespot-bouygues.com" || password != "admin") {
			return null;
		}
		
		// Return user
		var dbUserObj = {
			name: 'admin',
			role: 'admin',
			username: 'admin@lespot-bouygues.com'
		};

		return dbUserObj;
	}
}
 
// private method
function generateToken(user) {
	var dateObj = new Date();
	var expiresDate = dateObj.setDate(dateObj.getDate() + expires);
	var token = jwt.encode({
		exp: expiresDate
	}, secret);

	return {
		token: token,
		expires: expiresDate,
		user: user
	};
}
 
module.exports = auth;
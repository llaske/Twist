// User authentication
var jwt = require('jwt-simple');
var mongo = require('mongodb');

var secret = '';
var expires = 0;

var server;
var db;
var usersCollection;

var auth = {
	init: function(ini, callback) {
		// Load settings
		secret = ini.auth.secret;
		expires = ini.auth.expires;
		usersCollection = ini.collections.users;

		// Connect to database
		server = new mongo.Server(ini.database.server, ini.database.port, {auto_reconnect: true});
		db = new mongo.Db(ini.database.name, server, {w:1}); 
		db.open(function(err, db) {
			if(err) {
			}
			if (callback) callback();
		});
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
		auth.validate(username, password, function(dbUserObj) {
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
			updateToken(dbUserObj, function(token) {
				res.json(token);
				return;
			});
		});
	},
 
	// Validate user/password
	validate: function(username, password, callback) {
		// Check username presence
		db.collection(usersCollection, function(err, collection) {
			collection.findOne({'username':username}, function(err, item) {
				// Not found or wrong password
				if (!item || item.password != password) {
					callback(null);
					return;
				}
				
				// Return user
				callback(item);
			});
		});
	}
}
 
// Update token for user
function updateToken(user, callback) {
	// Generate new token
	var dateObj = new Date();
	var expiresDate = dateObj.setDate(dateObj.getDate() + expires);
	var token = jwt.encode({exp: expiresDate}, secret);

	// Update user
	user.token = token;
	user.expires = expiresDate;
	db.collection(usersCollection, function(err, collection) {
		collection.update({'username':user.username}, user, {safe:true}, function(err, result) {
			if (err) {
				callback(null);
			} else {
				callback({
					token: user.token,
					expires: user.expires
				});
			}
		});
	});
}
 
module.exports = auth;
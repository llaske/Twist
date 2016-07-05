// Twist server

var express = require('express');
var bodyParser = require('body-parser')
var settings = require('./settings');
var auth = require('./routes/auth');

var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

	
// Load settings
settings.load(function(ini) {
	// Init API
	auth.init(ini);
	
	// Register login API
	app.post("/login", auth.login);
	
	// TODO: Remove function used only to test token validation
	app.get("/validate", function(req, res) {
		auth.validateToken(req.query.username, req.query.token, function(isOkay) {
			res.json(isOkay);
		});
	});
	
	// Start listening
	app.listen(ini.web.port);
	console.log("Twist listening on port "+ini.web.port+"...");
});
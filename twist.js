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

	// Start listening
	app.listen(ini.web.port);
	console.log("Twist listening on port "+ini.web.port+"...");
});
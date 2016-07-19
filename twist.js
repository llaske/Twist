// Twist server

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var settings = require('./settings');
var auth = require('./routes/auth');

var app = express()

// Init express and headers
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
	if (req.method == 'OPTIONS') {
		res.status(200).end();
	} else {
		next();
	}
});

// Register static route
app.use(express.static(__dirname + '/client/dist'));


// Load settings then start web server
settings.load(function(ini) {
	// Init API
	auth.init(ini);

	// Register login
	app.post("/login", auth.login);

	// Register API
	app.all('/api/*', auth.validateRequest);
	app.get('/api/hello', function(req, res) {
		res.json("Hello world!");
	});

	// Start listening
	app.listen(ini.web.port);
	console.log("Twist listening on port "+ini.web.port+"...");
});

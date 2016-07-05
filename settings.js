// Load Settings

var	fs = require('fs'),
	ini = require('ini');

// Load and parse .ini file
exports.load = function(callback) {
	fs.readFile("twist.ini", 'utf-8', function(err, content) {
		if (err) throw err;
		callback(ini.parse(content));
	});
};
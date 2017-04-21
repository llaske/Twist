// Directly import in the database a set of data in JSON format
//  Usage:
//		node bulkimport <uid> <file>
//
// <uid> is the _id of users in users collection
// <file> is a JSON file with content to import, see a sample file below
//
//		[
//			{
//				"url": "http://www.latribune.fr/entreprises-finance/services/transport-logistique/sans-uber-et-lyft-une-ville-texane-tente-de-s-organiser-differemment-581360.html",
//				"text": "Uber étant parti, la ville de Austin au Texas se passe des VTC mais ce n'est pas forcément un bien...",
//				"published": true,
//				"cleaned": true,
//				"author": "@latribune",
//				"image": "http://static.latribune.fr/assets/bundles/latribunefront/img/subdomain/www/logo-mobile-www.png?version=v1.136.3",
//				"urlShortened": "http://bit.ly/29tEYYY",
//				"metadata":
//				{
//					"title": "Sans Uber et Lyft, une ville texane tente de s&#039;organiser différemment",
//					"description": "A Austin, au Texas, des réglementations strictes ont été mises en place en ma..."
//				},
//				"updatedOn": "2016-07-05 14:04:12Z",
//				"createdOn": "2016-07-05 14:04:12Z"
//			}
//			,
//			...
//		]
//

var settings = require('./settings');
var mongo = require('mongodb');
var fs = require('fs')

// Global variable
var server;
var db;
var usersCollection;
var postsCollection;
var jsonFile;
var uid;
var nbToImport;

// Print Usage
function usage() {
	console.log("Usage: node bulkimport uid file");
	console.log("\tuid is _id of user object in the Db where entries will be attached");
	console.log("\tfile is JSON file path to process");
	console.log("");
}

// Parse command line
function parseCommand() {
	if (process.argv.length < 3) {
		usage();
		process.exit(0);
	}
	uid = process.argv[2];
	jsonFile = process.argv[3];
}

// Init database
function initDb(ini, callback) {
	usersCollection = ini.collections.users;
	postsCollection = ini.collections.posts;
	server = new mongo.Server(ini.database.server, ini.database.port, {auto_reconnect: true});
	db = new mongo.Db(ini.database.name, server, {w:1});
	db.open(function(err, db) {
		if(err) {
			console.error("bulkimport: "+err);
			process.exit(1);
		}
		if (callback) callback();
	});
}

// Check uid
function checkUID(uid, callback) {
	// Query for uid
	var query = {};
	try {
		query._id = new mongo.ObjectID(uid);
	} catch (e) {
		console.error("bulkimport: "+e);
		process.exit(1);
	}

	// Retrieve all matching users
	db.collection(usersCollection, function(err, collection) {
		collection.find(query).toArray(function(err, items) {
			if (err) {
				console.error("bulkimport: "+err);
				process.exit(1);
			}
			if (items.length != 1) {
				console.error("bulkimport: invalid uid");
				process.exit(1);
			}
			if (callback) callback();
		});
	});
}

// Import entry in DB
function importEntry(entry, callback) {
	entry.uid = uid;
	db.collection(postsCollection, function (err, collection) {
		collection.insert(entry, {safe:true}, function(err, result) {
			if (err) {
				console.error("bulkimport: "+err);
				process.exit(1);
			}
			if (callback) callback();
		});
	});
}

// Load file
function loadFile(file, callback) {
	fs.readFile(file, function(err, data) {
		if (err) {
			console.error("bulkimport: "+err);
			process.exit(1);
		}
		if (callback) callback(data);
	});
}

// Process entries to import
function processData(data, callback) {
	var entries = JSON.parse(data);
	console.log(entries.length+" to process");
	var len = nbToImport = entries.length;
	var count = 0;
	for(var i = 0 ; i < len ; i++) {
		var entry = entries[i];
		importEntry(entry, function() {
			count++;
			if (count % 100 == 0) {
				console.log(count);
			}
			if (count == len) {
				if (callback) callback();
			}
		});
	}
	if (len == 0) {
		if (callback) callback();
	}
}

// Load INI
settings.load(function(ini) {
	parseCommand();
	initDb(ini, function() {
		checkUID(uid, function() {
			loadFile(jsonFile, function(data) {
				processData(data, function() {
					console.log("Done.");
					process.exit(0);
				})
			});
		});
	});
});

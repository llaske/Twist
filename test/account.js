
// Unit testing on accounts

var assert = require('assert');
var accounts = require('../routes/account');


// Connect to MongoDB
var settings = {
	database: {	server: "localhost", port: "27018",	name: "twist" },
	collections: { accounts: "accounts" }
};
var testUserUID = "577ba1c317a3bd6ae3b13642";

describe('init account', function() {
	it('should log to database', function(done) {
		accounts.init(settings, function() {
			done();

			describe('account', function(done) {
				// HACK: Dummy request to match Express interface
				var res = {
					send: function(value) {
						this.value = value;
						if (this.done) this.done();
					},
					status: function(value) {
						if (value) this.httpstatus = value;
						return this.httpstatus;
					}
				};

				// Start test
				this.timeout(2000);

				var dummyAccount = null;

				describe('#findAll()', function() {
					it('should return nothing for invalid user', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(0, res.value.length);
							done();
						}
						accounts.findAll({headers: {uid: 'ffffffffffffffffffffffff'}}, res);
					});

					it('should return all accounts for the user', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(true, res.value.length > 0);
							for(var i = 0 ; i < res.value.length ; i++) {
								assert.equal(true, res.value[i].name.length > 0);
								assert.equal(true, res.value[i].provider.length > 0);
								assert.equal(true, res.value[i].type.length > 0);
								assert.notEqual(undefined, res.value[i].keys);
								assert.notEqual(undefined, res.value[i].activated);
							}
							done();
						}
						accounts.findAll({headers: {uid: testUserUID}}, res);
					});

					it('should filter by type', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(true, res.value.length > 0);
							for(var i = 0 ; i < res.value.length ; i++) {
								assert.equal(true, res.value[i].name.length > 0);
								assert.equal(true, res.value[i].provider.length > 0);
								assert.equal("publisher", res.value[i].type);
								assert.notEqual(undefined, res.value[i].keys);
								assert.notEqual(undefined, res.value[i].activated);
							}
							done();
						}
						accounts.findAll({headers: {uid: testUserUID}, query: {type: 'publisher'}}, res);
					});

					it('should filter by provider', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(true, res.value.length > 0);
							for(var i = 0 ; i < res.value.length ; i++) {
								assert.equal(true, res.value[i].name.length > 0);
								assert.equal("twitter", res.value[i].provider);
								assert.equal(true, res.value[i].type.length > 0);
								assert.notEqual(undefined, res.value[i].keys);
								assert.notEqual(undefined, res.value[i].activated);
								if (res.value[i].name == "@dummy") {
									dummyAccount = res.value[i];
								}
							}
							done();
						}
						accounts.findAll({headers: {uid: testUserUID}, query: {provider: 'twitter'}}, res);
					});

					it('should filter by activated', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(true, res.value.length > 0);
							for(var i = 0 ; i < res.value.length ; i++) {
								assert.equal(true, res.value[i].name.length > 0);
								assert.equal(true, res.value[i].provider.length > 0);
								assert.equal(true, res.value[i].type.length > 0);
								assert.equal(true, res.value[i].activated)
								assert.notEqual(undefined, res.value[i].keys);
								assert.notEqual(undefined, res.value[i].activated);
							}
							done();
						}
						accounts.findAll({headers: {uid: testUserUID}, query: {activated: 'true'}}, res);
					});

					it('should multi-filter', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(true, res.value.length > 0);
							for(var i = 0 ; i < res.value.length ; i++) {
								assert.equal(true, res.value[i].name.length > 0);
								assert.equal(true, res.value[i].provider.length > 0);
								assert.equal('publisher', res.value[i].type);
								assert.equal(true, res.value[i].activated)
								assert.notEqual(undefined, res.value[i].keys);
								assert.notEqual(undefined, res.value[i].activated);
							}
							done();
						}
						accounts.findAll({headers: {uid: testUserUID}, query: {activated: 'true', type: 'publisher'}}, res);
					});
				});

				describe('#update()', function() {
					it('should be updated', function(done) {
						res.done = function() {
							var account = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('dummyType', account.type);
							assert.equal('dwitter', account.provider);
							assert.equal(true, account.activated);
							assert.notEqual(account.keys, undefined);
							assert.notEqual(account.keys.name, undefined);
							assert.notEqual(account.keys.value, undefined);
							done();
						}
						var update = {};
						update.uid = testUserUID;
						update.type = 'dummyType';
						update.activated = 'true';
						update.provider = 'dwitter';
						update.keys = JSON.stringify({ name: "twist", value: "spot"});
						accounts.update({body: update, params: {id: dummyAccount._id} }, res);
					});

					it('should be updated a second time', function(done) {
						res.done = function() {
							var account = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('publisher', account.type);
							assert.equal('twitter', account.provider);
							assert.equal(false, account.activated);
							assert.notEqual(account.keys, undefined);
							assert.notEqual(account.keys.consumer_key, undefined);
							assert.notEqual(account.keys.consumer_secret, undefined);
							assert.notEqual(account.keys.access_token_key, undefined);
							assert.notEqual(account.keys.access_token_secret, undefined);
							done();
						}
						var update = {};
						update.uid = testUserUID;
						update.type = 'publisher';
						update.activated = 'false';
						update.provider = 'twitter';
						update.keys = JSON.stringify({
							consumer_key : "A",
							consumer_secret : "B",
							access_token_key : "C",
							access_token_secret : "D"
						}),
						accounts.update({body: update, params: {id: dummyAccount._id} }, res);
					});
				});
			});
		});
	});
});

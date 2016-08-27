
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
						accounts.findAll({headers: {uid: testUserUID}, params: {type: 'publisher'}}, res);
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
							}
							done();
						}
						accounts.findAll({headers: {uid: testUserUID}, params: {provider: 'twitter'}}, res);
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
						accounts.findAll({headers: {uid: testUserUID}, params: {activated: 'true'}}, res);
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
						accounts.findAll({headers: {uid: testUserUID}, params: {activated: 'true', type: 'publisher'}}, res);
					});
				});
			});
		});
	});
});

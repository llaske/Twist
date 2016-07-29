
// Unit testing on authentication

var assert = require('assert');
var auth = require('../routes/auth');


// Connect to MongoDB
var settings = {
	database: {	server: "localhost", port: "27018",	name: "twist" },
	auth: { secret: "twist", expires: 7 },
	collections: { users: "users" }
};

describe('init auth', function() {

	it('should log to database', function(done) {
		auth.init(settings, function() {
			done();
		});
	});
});

describe('auth', function() {
	// HACK: Dummy request to match Express interface
	var res = {
		json: function(value) {
			this.value = value;
			if (this.done) this.done();
		},
		status: function(status) {
			this.statusvalue = status;
		},
		next: function() {
			if (this.done) this.done(true);
		}
	};

	var token = {};

	describe('#login()', function() {
		it('need to have an user and password', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.login({body:{}}, res);
		});

		it('need to have a password', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.login({body:{username: "someone"}}, res);
		});

		it('need to specify an existing user', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.login({body:{username: "someone", password: "xxx"}}, res);
		});

		it('password should match', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.login({body:{username: "test@lespot-bouygues.com", password: "xxx"}}, res);
		});

		it('should log correctly', function(done) {
			res.done = function() {
				assert.notEqual(undefined, res.value.uid);
				assert.notEqual(undefined, res.value.token);
				assert.notEqual(undefined, res.value.expires);
				token = res.value;
				done();
			}
			auth.login({body:{username: "test@lespot-bouygues.com", password: "test"}}, res);
		});
	});

	describe('#validateRequest()', function() {
		it('need to have an user and a token', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.validateRequest({body:{}, query:{}, headers:[]}, res);
		});

		it('need to have a token', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.validateRequest({body:{x_key: "someone"}, query:{}, headers:[]}, res);
		});

		it('need to specify an existing user', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.validateRequest({body:{x_key: "someone", access_token: "xxx"}, query:{}, headers:[]}, res);
		});

		it('need to specify a valid token', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.validateRequest({body:{x_key: "test@lespot-bouygues.com", access_token: "xxx"}, query:{}, headers:[]}, res);
		});

		it('token is valid', function(done) {
			res.done = function(next) {
				assert.equal(true, next);
				done();
			}
			auth.validateRequest({body:{x_key: "test@lespot-bouygues.com", access_token: token.token}, query:{}, headers:[]}, res, function() { res.next();});
		});

		it('log with expired login', function(done) {
			res.done = function() {
				assert.notEqual(undefined, res.value.uid);
				assert.notEqual(undefined, res.value.token);
				assert.notEqual(undefined, res.value.expires);
				token = res.value;
				done();
			}
			settings.auth.expires = 0;	// HACK: Reinit with an expire time of 0
			auth.init(settings, function() {
				auth.login({body:{username: "test@lespot-bouygues.com", password: "test"}}, res);
			});
		});

		it('need to specify a token not expired', function(done) {
			res.done = function() {
				assert.equal(401, res.value.status);
				done();
			}
			auth.validateRequest({body:{x_key: "test@lespot-bouygues.com", access_token: token.token}, query:{}, headers:[]}, res);
		});
	});
});

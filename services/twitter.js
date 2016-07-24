
// Service to post in Twitter
var twitter = require('twitter');

module.exports = {
	post: function(account, twist, callback) {
		console.log('post to twitter '+twist.url+' at '+account.name);
		callback({provider: 'twitter', name: account.name, result: true});
	}
}

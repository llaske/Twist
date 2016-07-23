
// Service to post in Twitter
var twitter = require('twitter');

module.exports = {
	post: function(account, twist) {
		console.log('post to twitter '+twist.url+' at '+account.name);
		return {provider: 'twitter', name: account.name, result: true};
	}
}

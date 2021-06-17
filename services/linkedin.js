
// Service to post on LinkedIn

'use strict';

const request = require('request');
const validator = require('validator');

module.exports = {
	name: 'linkedin',

	type: 'publisher',

	post: function(account, twist, callback) {
		// Check keys presence
		var keys = account.keys;
		if (!keys || !keys.client_id || !keys.client_secret || !keys.session_token || !keys.linkedin_urn) {
			return null;
		}
		
		var text = twist.text ? twist.text + ' ' : '';
		var url = twist.url;
		var thumb = twist.image;
		var title = null;
		
		var result = {
			aid: account._id,
			provider: 'linkedin',
			name: account.name
		}
		
		new Promise((resolve, reject) => {
			const errors = [];
			
			if(!text || validator.isEmpty(text)) {
				errors.push({ param: 'text', msg: 'Invalid value.'});
			}
			if(!url || !validator.isURL(url)) {
				errors.push({ param: 'url', msg: 'Invalid value.'});
			}
			if(thumb && !validator.isURL(thumb)) {
				errors.push({ param: 'thumb', msg: 'Invalid value.'});
			}
			
			if(errors.length > 0) {
				reject(errors);
			} else {
				const content = {
					text: text,
					shareUrl: url
				};
				if (title) {
					content.title = title;
				}
				if (thumb) {
					content.shareThumbnailUrl = thumb;
				}
				
				try {
					LinkedInAPI.publishContent(keys, content).then(function(response) {
						if (response.status) {
							resolve({ error: response.status + ": " + response.message });
						} else {
							resolve({ success: 'Post published successfully.', id: response.id });
						}
					});
				} catch(err) {
					resolve({ error: 'Unable to publish your post.' });
				}
			}
		}).then(function(response) {
			if (response.error) {
				result.error = response.error;
			} else {
				result.id = response.id;
			}
			callback(result);
		});
	},
	
	get: function(account, twist, callback) {
		callback({
			aid: account._id,
			provider: 'linkedin',
			name: account.name,
			error: 'unsupported operation'
		});
		return;
	},
	
	delete: function(account, twist, callback) {
		callback({
			aid: account._id,
			provider: 'linkedin',
			name: account.name,
			error: 'unsupported operation'
		});
		return;
	}
};

// LinkedIn API class inspired by work from Gabriel Romanato https://gabrieleromanato.name/nodejs-how-to-publish-a-post-on-linkedin-via-api-with-expressjs
class LinkedInAPI {
	static publishContent(keys, content) {
		const url = 'https://api.linkedin.com/v2/shares';
		const { title, text, shareUrl, shareThumbnailUrl } = content;
		const body = {
			owner: keys.linkedin_urn,
			subject: title,
			text: {
				text: text
			},
			content: {
				contentEntities: [{
					entityLocation: shareUrl
				}]
			},
			distribution: {
				linkedInDistributionTarget: {}
			}
		};
		const headers = {
			'Authorization': 'Bearer ' + keys.session_token,
			'cache-control': 'no-cache',
			'X-Restli-Protocol-Version': '2.0.0',
			'x-li-format': 'json'
		};
		
		return new Promise((resolve, reject) => {
			request.post({ url: url, json: body, headers: headers}, (err, response, body) => {
				if(err) {
					reject(err);
				} else {
					resolve(body);
				}
			});
		});
	}
}

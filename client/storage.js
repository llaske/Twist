

module.exports = {
	// Test if HTML5 storage is available
	test: function() {
		if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime)
			return true;
		else
			return (typeof(Storage) !== "undefined" && typeof(window.localStorage) !== "undefined");
	},

	// Set a value in the storage
	setValue: function(key, value, callback) {
		if (this.test()) {
			try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
					var item = {};
					item[key] = value;
					chrome.storage.local.set(item, callback);
				} else {
					window.localStorage.setItem(key, JSON.stringify(value));
					callback(value);
				}
			} catch (err) {
				callback(null);
			}
		}
	},

	// Get a value in the storage
	getValue: function(key, callback) {
		if (this.test()) {
			try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
					chrome.storage.local.get(key, function(items) {
						callback(items[key]);
					});
				} else {
					callback(JSON.parse(window.localStorage.getItem(key)));
				}
			} catch (err) {
				callback(null);
			}
		}
		return null;
	},

	// Remove a value in the storage
	removeValue: function(key, callback) {
		if (this.test()) {
			try {
				if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
					this.values[key] = null;
					chrome.storage.remove(key, callback);
				} else {
					window.localStorage.removeItem(key);
					callback(key);
				}
			} catch (err) {
				callback(null);
			}
		}
	}
}

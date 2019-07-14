"use strict";

chrome.storage.local.get((cache) => {

	// reset cache after update
	const version = chrome.runtime.getManifest().version;
	if (version !== cache.version) {
		chrome.storage.local.clear();
		cache = {version: version};
		chrome.storage.local.set(cache);
	}

	// platform support cache
	const Platforms = (function(cache) {

		function cache_clean() {
			const expired = parseInt(Date.now() / 1000, 10) - 86400; // one day ago
			for (const [id, cachedItem] of Object.entries(cache)) {
				if (cachedItem.expires < expired) {
					delete cache[id];
				}
			}
		}

		function cache_set(id, platforms) {
			cache[id] = {platforms, expires: parseInt(Date.now() / 1000, 10)};
			chrome.storage.local.set({platforms: cache});
		}

		function get(id) {
			cache_clean();
			return new Promise((resolve, reject) => {
				if (cache[id]) {
					resolve(cache[id].platforms);
				} else {
					const [type, itemid] = id.split("/", 2);
					let url;
					switch(type) {
						case "app":
							url = "https://store.steampowered.com/api/appdetails/?filters=platforms&appids=" + itemid;
							break;
						case "sub":
							url = "https://store.steampowered.com/api/packagedetails/?filters=platforms&packageids=" + itemid;
							break;
						default:
							reject();
							return;
					}
					fetch(url).then(response => response.json()).then((data) => {
						if (((data[itemid] || {}).data || {}).platforms) {
							const platforms = data[itemid].data.platforms;
							cache_set(id, platforms);
							resolve(platforms);
						}
					}).catch(reject);
				}
			});
		}

		return {
			get
		};
	}(cache.platforms || {}));

	function checkForValidUrl(tabId, changeInfo, tab) {
		if (tab.url.match(/https?:\/\/www\.steamgifts\.com/)) {
			chrome.pageAction.show(tabId);
		}
	}
	function messageHandler(message, sender, sendResponse) {
		if (message.points) {
			relayMessage(message, sender);
		}
		if (message.platformLookup) {
			Platforms.get(message.platformLookup).then(sendResponse);
		}
		return true;
	}
	function relayMessage(message, sender) {
		chrome.tabs.query({url: "*://www.steamgifts.com/*"}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (tabs[i].id != sender.tab.id) {
					chrome.tabs.sendMessage(tabs[i].id, message);
				}
			}
		});
	}

	chrome.tabs.onUpdated.addListener(checkForValidUrl);
	chrome.runtime.onMessage.addListener(messageHandler);

});


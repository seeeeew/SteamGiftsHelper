"use strict";

function checkForValidUrl(tabId, changeInfo, tab) {
	if (tab.url.indexOf('http://www.steamgifts.com') === 0) {
		chrome.pageAction.show(tabId);
	}
}
function relayMessage(message, sender, sendResponse) {
	chrome.tabs.query({url: "http://www.steamgifts.com/*"}, function(tabs) {
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].id != sender.tab.id) {
				chrome.tabs.sendMessage(tabs[i].id, message);
			}
		}
	});
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.runtime.onMessage.addListener(relayMessage);


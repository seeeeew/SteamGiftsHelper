"use strict";

function checkForValidUrl(tabId, changeInfo, tab) {
	if (tab.url.match(/https?:\/\/www\.steamgifts\.com/)) {
		chrome.pageAction.show(tabId);
	}
}
function relayMessage(message, sender, sendResponse) {
	chrome.tabs.query({url: "*://www.steamgifts.com/*"}, function(tabs) {
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].id != sender.tab.id) {
				chrome.tabs.sendMessage(tabs[i].id, message);
			}
		}
	});
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.runtime.onMessage.addListener(relayMessage);


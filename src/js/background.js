"use strict";

function checkForValidUrl(tabId, changeInfo, tab) {
	if (tab.url.indexOf('http://www.steamgifts.com') === 0) {
		chrome.pageAction.show(tabId);
	}
}
function relayMessage(message, sender, sendResponse) {
	chrome.tabs.query({url: "http://www.steamgifts.com/*"}, function(tabs) {
		if (message.refresh_points_interval !== undefined) {
			chrome.alarms.clear("refresh_points");
			if (message.refresh_points_interval !== null) {
				chrome.alarms.create("refresh_points", {periodInMinutes: message.refresh_points_interval});
			}
			delete message.refresh_points_interval;
		}
		if (message !== {}) {
			for (var i = 0; i < tabs.length; i++) {
				if (!sender.tab || tabs[i].id != sender.tab.id) {
					chrome.tabs.sendMessage(tabs[i].id, message);
				}
			}
		}
	});
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.runtime.onMessage.addListener(relayMessage);

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name == "refresh_points") {
		chrome.tabs.query({url: "http://www.steamgifts.com/*"}, function(tabs) {
			if (tabs.length !== 0) {
				$.get("http://www.steamgifts.com/", function(data) {
					for (var i = 0; i < tabs.length; i++) {
						chrome.tabs.sendMessage(tabs[i].id, {points: $(data).find(".nav__points").text()});
					}
				});
			} else {
				chrome.alarms.clear("refresh_points");
			}
		});
	}
});


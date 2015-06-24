function checkForValidUrl(tabId, changeInfo, tab) {
	if (tab.url.indexOf('http://www.steamgifts.com') == 0) {
		chrome.pageAction.show(tabId);
	}
};
chrome.tabs.onUpdated.addListener(checkForValidUrl);


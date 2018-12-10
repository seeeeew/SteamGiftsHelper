"use strict";

let storage_sync_promise = new Promise((resolve) => {
	chrome.storage.sync.get(resolve);
});
let storage_local_promise = new Promise((resolve) => {
	chrome.storage.local.get(resolve);
});
let document_ready_promise = new Promise((resolve) => {
	if (/^(complete|loaded|interactive)$/.test(document.readyState)) {
		resolve();
	} else {
		document.addEventListener("DOMContentLoaded", resolve);
	}
});

Promise.all([storage_sync_promise, storage_local_promise, document_ready_promise]).then(([settings, cache]) => {

document.querySelectorAll("input[type=checkbox]").forEach((element) => {
	element.addEventListener("change", (event) => {
		chrome.storage.sync.set({[event.target.id]: event.target.checked});
	});
	if (!settings.hasOwnProperty(element.id)) {
		settings[element.id] = true;
	}
	element.checked = settings[element.id];
});

reset_platform_cache.addEventListener("click", (event) => {
	chrome.storage.local.remove("platforms", () => {
		event.target.classList.add("done");
	});
});

});


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

let defaultsettings = {
	pin_header: true,
	synchronize_points: true,
	platform_icons: true,
	enter_button: true
};

Promise.all([storage_sync_promise, storage_local_promise, document_ready_promise]).then(([settings]) => {

	settings = {...defaultsettings, ...settings};

	document.querySelectorAll("input[type=checkbox]").forEach((element) => {
		element.addEventListener("change", (event) => {
			chrome.storage.sync.set({[event.target.id]: event.target.checked});
		});
		if (!(element.id in settings)) {
			settings[element.id] = true;
		}
		element.checked = settings[element.id];
	});

	document.querySelector("#reset_platform_cache").addEventListener("click", (event) => {
		chrome.storage.local.remove("platforms", () => {
			event.target.classList.add("done");
		});
	});

});


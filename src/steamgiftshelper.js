"use strict";

let storage_sync_promise = new Promise((resolve) => {
	chrome.storage.sync.get(resolve);
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

Promise.all([storage_sync_promise, document_ready_promise]).then(([settings]) => {

settings = {...defaultsettings, ...settings};

function requestJSON(method, url, parameters) {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState != 4 || xhr.status != 200) return;
			resolve(JSON.parse(xhr.responseText));
		};
		xhr.open(method, url);
		if (method === "POST") xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send(parameters);
	});
}

// platform support cache
const Platforms = {
	get: (id) => new Promise((resolve) => {
		chrome.runtime.sendMessage({platformLookup: id}, resolve);
	})
};

// synchronize points across tabs
const pointsElement = document.querySelector(".nav__points");
let previous_points;
if (pointsElement) {
	previous_points = pointsElement.innerText;
}
function updatePoints(points, synchronize) {
	if (pointsElement && points != previous_points) {
		previous_points = points;
		pointsElement.innerText = points;
		if (synchronize !== false && settings.synchronize_points) {
			synchronizePoints(points);
		}
	}
}
function synchronizePoints(points) {
	chrome.runtime.sendMessage({points: points});
}
if (pointsElement && settings.synchronize_points) {
	synchronizePoints(pointsElement.innerText);
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.points) {
			updatePoints(message.points, false);
		}
	});
	pointsElement.addEventListener("DOMSubtreeModified", (event) => {
		const points = event.target.innerText;
		if (points !== "" && points !== previous_points) {
			synchronizePoints(points);
			previous_points = points;
		}
	});
}

// Pin header bar to top
if (settings.pin_header) {
	document.body.classList.add("pin_header");
}

// clickable magnifying glass in search boxes	
document.querySelectorAll(".sidebar__search-container .fa-search").forEach((element) => element.addEventListener("click", () => {
	const script = document.createElement("script");
	script.innerHTML = "$('.sidebar__search-input').trigger($.Event('keypress', {which: 13}));";
	(document.body || document.head).appendChild(script);
}));

// Giveaway browsing pages
if (window.location.pathname.match(/^\/(?:$|giveaways\/)/)) {
	// Add platform support icons
	if (settings.platform_icons) {
		const add_platform_icons = function(element, platforms = {}) {
			const next = element.nextSibling;
			if (platforms.windows) {
				const icon = document.createElement("i");
				icon.classList.add("giveaway__icon", "fa", "fa-windows");
				next.parentNode.insertBefore(icon, next);
			}
			if (platforms.mac) {
				const icon = document.createElement("i");
				icon.classList.add("giveaway__icon", "fa", "fa-apple");
				next.parentNode.insertBefore(icon, next);
			}
			if (platforms.linux) {
				const icon = document.createElement("i");
				icon.classList.add("giveaway__icon", "fa", "fa-linux");
				next.parentNode.insertBefore(icon, next);
			}
		};
		
		document.querySelectorAll("a.giveaway__icon[href*='//store.steampowered.com/']").forEach((element) => {
			const match = element.href.match(/^[^:]+:\/\/store.steampowered.com\/((?:app|sub)\/\d+)/);
			if (match) {
				Platforms.get(match[1]).then((platforms) => {
					add_platform_icons(element, platforms);
				});
			}
		});
	}
	
	const xsrfElement = document.querySelector("[name=xsrf_token]");
	if (xsrfElement) {
		const xsrf_token = xsrfElement.value;
		if (xsrfElement && xsrf_token) {
			if (settings.enter_button) {
				const click_enter_icon = function(event) {
					const enter_icon = event.target;
					const code = enter_icon.parentElement.firstElementChild.href.match(/\/giveaway\/([^\/\?]+)/);
					const wrapper = enter_icon.closest(".giveaway__row-inner-wrap");
					const entered = wrapper.classList.contains("is-faded");
					enter_icon.classList.remove("fa-plus-circle", "fa-minus-circle");
					enter_icon.classList.add("fa-spin", "fa-refresh");
					const parameters = "xsrf_token=" + encodeURIComponent(xsrf_token) + "&do=entry_" + (entered ? "delete" : "insert") + "&code=" + encodeURIComponent(code[1]);
					requestJSON("POST", "/ajax.php", parameters).then((data) => {
						enter_icon.classList.remove("fa-spin", "fa-refresh");
						if (data.type === "success") {
							if (wrapper.classList.contains("is-faded")) {
								wrapper.classList.remove("is-faded");
								enter_icon.classList.add("fa-plus-circle");
							} else {
								wrapper.classList.add("is-faded");
								enter_icon.classList.add("fa-minus-circle");
							}
						} else {
							if (wrapper.classList.contains("is-faded")) {
								enter_icon.classList.add("fa-minus-circle");
							} else {
								enter_icon.classList.add("fa-plus-circle");
							}
						}
						updatePoints(data.points);
					});
				};
			
				document.querySelectorAll("a.giveaway__icon[href*='//store.steampowered.com/app/'], a.giveaway__icon[href*='//store.steampowered.com/sub/']").forEach((element) => {
					// Enable entering giveways from browsing page
					if (settings.enter_button) {
						const enter_icon = document.createElement("i");
						enter_icon.classList.add("giveaway__icon", "fa");
						element.parentNode.insertBefore(enter_icon, element);
						enter_icon.addEventListener("click", click_enter_icon);
						if (enter_icon.closest(".giveaway__row-inner-wrap").classList.contains("is-faded")) {
							enter_icon.classList.add("fa-minus-circle");
						} else {
							enter_icon.classList.add("fa-plus-circle");
						}
					}
				});
			}
		}
	}
}

});


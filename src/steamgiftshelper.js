"use strict";

var storage_sync_deferred = new $.Deferred();
chrome.storage.sync.get(storage_sync_deferred.resolve);
var storage_local_deferred = new $.Deferred();
chrome.storage.local.get(storage_local_deferred.resolve);

$($.when(storage_sync_deferred, storage_local_deferred).done(function(settings, cache) {

// platform support cache
var platforms = (function(cache) {
	
	function get(appid) {
		cache_clean();
		var deferred = new $.Deferred();
		if (cache[appid] !== undefined) {
			deferred.resolveWith(null, [cache[appid][0]]);
		} else {
			var url = "http://store.steampowered.com/api/appdetails/?filters=platforms&appids=" + appid;
			$.get(url).done(function(data) {
				if (!((data[appid] || {}).data || {}).platforms) return;
				var platforms = data[appid].data.platforms;
				cache_set(appid, platforms);
				deferred.resolveWith(null, [platforms]);
			});
		}
		return deferred.promise();
	}
	
	function cache_clean() {
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		$.each(cache, function(key, values) {
			if (values[1] < expire_time) {
				delete cache[key];
			}
		});
	}
	
	function cache_set(appid, platforms) {
		cache[appid] = [platforms, parseInt(Date.now() / 1000, 10)];
		chrome.storage.local.set({platforms: cache});
	}
	
	return {
		get: get
	}
})(cache.platforms || {});

// Pin header bar to top
if ((settings.pin_header || false) === true) {
	$("body").addClass("pin_header");
}

// clickable magnifying glass in search boxes
$(".sidebar__search-container .fa-search").attr("onclick", '$(".sidebar__search-input").trigger($.Event("keypress", {which: 13}));');
$(".sidebar__search-container .fa-search").css("cursor", "pointer");

// Giveaway browsing pages
if (window.location.pathname.match(/^\/(?:$|giveaways\/)/)) {
	// Add platform support icons
	if ((settings.platform_icons || false) === true) {
		function add_platform_icons(element, platforms) {
			var next = element.nextSibling;
			if (platforms.windows) {
				$("<i class='giveaway__icon fa fa-windows'></i>").insertBefore(next);
			}
			if (platforms.mac) {
				$("<i class='giveaway__icon fa fa-apple'></i>").insertBefore(next);
			}
			if (platforms.linux) {
				$("<i class='giveaway__icon fa fa-linux'></i>").insertBefore(next);
			}
		}
		
		$("a.giveaway__icon[href*='//store.steampowered.com/app/']").each(function() {
			var match = this.href.match(/^[^:]+:\/\/store.steampowered.com\/app\/(\d+)/);
			var appid = match[1];
			platforms.get(appid).done((function(platforms) {
				add_platform_icons(this, platforms);
			}).bind(this));
		});
	}
	
	var xsrf_token = $("[name=xsrf_token]").val();
	if (xsrf_token) {
		if ((settings.enter_button || false) === true || (settings.browsing_search_similar || false) === true) {
			function click_enter_icon() {
				var $enter_icon = $(this);
				var code = $enter_icon.siblings()[0].href.match(/\/giveaway\/([^\/\?]+)/);
				var $wrapper = $enter_icon.parents(".giveaway__row-inner-wrap").first();
				var entered = $wrapper.hasClass("is-faded");
				$.post({
					url: "/ajax.php",
					data: "xsrf_token=" + xsrf_token + "&do=entry_" + (entered ? "delete" : "insert") + "&code=" + code[1],
					beforeSend: function() {
						$enter_icon.removeClass("fa-plus-circle fa-minus-circle");
						$enter_icon.addClass("fa-spin fa-refresh");
					}
				}).done(function(data) {
					var json = $.parseJSON(data);
					$enter_icon.removeClass("fa-spin fa-refresh");
					if (json.type == "success") {
						if ($wrapper.hasClass("is-faded")) {
							$wrapper.removeClass("is-faded");
							$enter_icon.addClass("fa-plus-circle");
						} else {
							$wrapper.addClass("is-faded");
							$enter_icon.addClass("fa-minus-circle");
						}
					} else {
						if ($wrapper.hasClass("is-faded")) {
							$enter_icon.addClass("fa-minus-circle");
						} else {
							$enter_icon.addClass("fa-plus-circle");
						}
					}
					$(".nav__points").text(json.points);
				});
			}
		
			$("a.giveaway__icon[href*='//store.steampowered.com/app/'], a.giveaway__icon[href*='//store.steampowered.com/sub/']").each(function() {
				// Enable entering giveways from browsing page
				if ((settings.enter_button || false) === true) {
					var $enter_icon = $("<i class='giveaway__icon fa'></i>");
					$enter_icon.insertBefore(this);
					$enter_icon.click(click_enter_icon);
					if ($enter_icon.parents(".giveaway__row-inner-wrap").first().hasClass("is-faded")) {
						$enter_icon.addClass("fa-minus-circle");
					} else {
						$enter_icon.addClass("fa-plus-circle");
					}
				}
			
				// Find similar giveaways
				if ((settings.browsing_search_similar || false) === true) {
					var game_name = $(this).siblings().first().text();
					var $search_icon = $("<a href='/giveaways/search?q=" + encodeURIComponent(game_name) + "' class='search_similar giveaway__icon fa fa-search'></a>");
					$search_icon.insertBefore(this);
				}
			});
		}
	
		// Enable hiding games without page refresh
		if ((settings.ajax_hide || false) === true) {
			var $form = $(".popup--hide-games form");
			$form.replaceWith("<div>" + $form.html() + "</div>");
			var $hide_button = $(".popup--hide-games .form__submit-button");
			$hide_button.click(function() {
				var game_id = $(".popup--hide-games [name=game_id]").val();
				$.post({
					url: "",
					data: "xsrf_token=" + xsrf_token + "&do=hide_giveaways_by_game_id&game_id=" + game_id,
					beforeSend: function() {
						$hide_button.children(".fa").removeClass("fa-check-circle");
						$hide_button.children(".fa").addClass("fa-spin fa-refresh");
					}
				}).done(function() {
					$("[data-game-id=" + game_id + "]").closest(".giveaway__row-outer-wrap").remove();
					$(".b-close").click();
					$hide_button.children(".fa").removeClass("fa-spin fa-refresh");
					$hide_button.children(".fa").addClass("fa-check-circle");
					if ($(".pinned-giveaways__outer-wrap .giveaway__row-outer-wrap").length == 0) {
						$(".pinned-giveaways__outer-wrap").remove();
					}
				});
			});
		}
	}
}

// Giveaway detail pages
if (window.location.pathname.match(/^\/giveaway\//)) {
	// Find similar giveaways
	if ((settings.detail_search_similar || false) === true) {
		var game_name = $(".featured__heading > :first-child").text();
		var $search_icon = $("<a href='/giveaways/search?q=" + encodeURIComponent(game_name) + "' class='search_similar fa fa-search'></a>");
		$(".featured__heading").append($search_icon);
	}
}

}));


"use strict";

var storage_sync = chrome.storage.sync;
var storage_sync_deferred = new $.Deferred();
storage_sync.get(storage_sync_deferred.resolve);
var storage_local = chrome.storage.local;
var storage_local_deferred = new $.Deferred();
storage_local.get(storage_local_deferred.resolve);
var document_ready_deferred = new $.Deferred();
$(document).ready(document_ready_deferred.resolve);

$.when(storage_sync_deferred, storage_local_deferred, document_ready_deferred).done(function(settings, cache) {

function refreshDependencies() {
	$("[data-depends-on]").each(function() {
		var satisfied = true;
		$.each($(this).attr("data-depends-on").split(","), function(i, dependency) {
			var $element = $("#" + dependency);
			if (!$element.prop("checked") || $element.prop("disabled")) {
				satisfied = false;
				return false;
			}
		});
		this.disabled = !satisfied;
		var $label = $("label[for=" + this.id + "]");
		if (satisfied) {
			$label.removeClass("disabled");
		} else {
			$label.addClass("disabled");
		}
	});
}
$("input[type=checkbox]").change(function() {
	settings[this.id] = this.checked;
	storage_sync.set(settings);
	refreshDependencies();
});
$("input[type=checkbox]").each(function() {
	if (!settings.hasOwnProperty(this.id)) {
		settings[this.id] = true;
	}
	this.checked = settings[this.id];
});
$("input[type=number]").change(function() {
	if (this.min && +this.value < +this.min) {
		this.value = +this.min;
	}
	settings[this.id] = +this.value;
	storage_sync.set(settings);
});
$("input[type=number]").each(function() {
	if (!settings.hasOwnProperty(this.id)) {
		settings[this.id] = this.value;
	} else {
		this.value = settings[this.id];
	}
});

var $reset_platform_cache = $("#reset_platform_cache");
$reset_platform_cache.click(function() {
	chrome.storage.local.remove("platforms", function() {
		$reset_platform_cache.addClass("done");
	});
});

refreshDependencies();

$("#refresh_points, #refresh_points_interval").change(function() {
	chrome.runtime.sendMessage({
		refresh_points_interval: (settings.synchronize_points && settings.refresh_points) ? settings.refresh_points_interval : null
	});
});

});


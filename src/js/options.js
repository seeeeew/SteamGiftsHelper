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

$("input[type=checkbox]").change(function() {
	var save = {};
	save[this.id] = this.checked;
	storage_sync.set(save);
});
$("input[type=checkbox]").each(function() {
	if (!settings.hasOwnProperty(this.id)) {
		settings[this.id] = true;
	}
	this.checked = settings[this.id];
});

var $reset_platform_cache = $("#reset_platform_cache");
$reset_platform_cache.click(function() {
	chrome.storage.local.remove("platforms", function() {
		$reset_platform_cache.addClass("done");
	});
});

});


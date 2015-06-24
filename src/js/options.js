var storage = chrome.storage.sync;

$(storage.get(function(settings) {
	$("input[type=checkbox]").each(function() {
		if (!settings.hasOwnProperty(this.id)) {
			settings[this.id] = true;
		}
		this.checked = settings[this.id];
		this.onchange = function() {
			var save = new Object();
			save[this.id] = this.checked;
			storage.set(save);
		}
	});
}));


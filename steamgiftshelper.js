$(function(){
	// restore scroll position after hiding game
	var scroll = window.location.hash.match(/^#?(\d+)/);
	if (scroll) {
		window.scrollTo(0, scroll[1]);
		history.replaceState({}, document.title, window.location.href.replace(/#.*$/, ""));
	}
	
	// save scroll position for restoring after hiding games
	window.onscroll = function() {
		$(".popup--hide-games form")[0].action = "#" + window.scrollY;
	}
	
	// add platform icons
	$("a.giveaway__icon[href*='//store.steampowered.com/app/']").each(function() {
		match = this.href.match(/^[^:]+:\/\/store.steampowered.com\/app\/(\d+)/);
		var appid = match[1];
		$.ajax({
			url: "http://store.steampowered.com/api/appdetails/?filters=platforms&appids=" + appid,
			context: this
		}).done(function(data) {
			if (!((data[appid] || {}).data || {}).platforms) return;
			var platforms = data[appid].data.platforms;
			var next = this.nextSibling;
			var parent = this.parentNode;
			if (platforms.windows) {
				parent.insertBefore($.parseHTML("<i class='giveaway__icon fa fa-windows'></i>")[0], next);
			}
			if (platforms.mac) {
				parent.insertBefore($.parseHTML("<i class='giveaway__icon fa fa-apple'></i>")[0], next);
			}
			if (platforms.linux) {
				parent.insertBefore($.parseHTML("<i class='giveaway__icon fa fa-linux'></i>")[0], next);
			}
		})
	});
});


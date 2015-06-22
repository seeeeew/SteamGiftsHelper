$(function(){
	"use strict";
	
	var xsrf_token = $("[name=xsrf_token]")[0].value;
	
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
	
	// add platform and enter/remove icons
	$("a.giveaway__icon[href*='//store.steampowered.com/app/']").each(function() {
		var match = this.href.match(/^[^:]+:\/\/store.steampowered.com\/app\/(\d+)/);
		var appid = match[1];
		$.ajax({
			url: "http://store.steampowered.com/api/appdetails/?filters=platforms&appids=" + appid,
			context: this
		}).done(function(data) {
			if (!((data[appid] || {}).data || {}).platforms) return;
			add_platform_icons(this, data[appid].data.platforms);
		})
	});
	$("a.giveaway__icon[href*='//store.steampowered.com/app/'], a.giveaway__icon[href*='//store.steampowered.com/sub/']").each(function() {
		var enter_icon = $.parseHTML("<i class='giveaway__icon fa'></i>")[0];
		this.parentNode.insertBefore(enter_icon, this);
		enter_icon.onclick = click_enter_icon;
		enter_icon.parentWrapper = $(enter_icon.parentNode.parentNode.parentNode);
		if (enter_icon.parentWrapper.hasClass("is-faded")) {
			$(enter_icon).addClass("fa-minus-circle");
		} else {
			$(enter_icon).addClass("fa-plus-circle");
		}
	});
	function click_enter_icon() {
		var code = (this.parentNode.firstElementChild.href || {}).match(/\/giveaway\/([^\/\?]+)/);
		var entered = this.parentWrapper.hasClass("is-faded");
		if (code) {
			$.ajax({
				method: "POST",
				url: "/ajax.php",
				data: "xsrf_token=" + xsrf_token + "&do=entry_" + (entered ? "delete" : "insert") + "&code=" + code[1],
				context: this,
				beforeSend: function(){
					$(this).removeClass("fa-plus-circle fa-minus-circle");
					$(this).addClass("fa-spin fa-refresh");
				}
			}).done(function(data){
				var json = $.parseJSON(data);
				$(this).removeClass("fa-spin fa-refresh");
				if (json.type == "success") {
					if (this.parentWrapper.hasClass("is-faded")) {
						this.parentWrapper.removeClass("is-faded");
						$(this).addClass("fa-plus-circle");
					} else {
						this.parentWrapper.addClass("is-faded");
						$(this).addClass("fa-minus-circle");
					}
				} else {
					if (this.parentWrapper.hasClass("is-faded")) {
						$(this).addClass("fa-minus-circle");
					} else {
						$(this).addClass("fa-plus-circle");
					}
				}
				$(".nav__points").text(json.points);
			});
		}
	}
	
	function add_platform_icons(element, platforms) {	
		var next = element.nextSibling;
		var parent = element.parentNode;
		if (platforms.windows) {
			parent.insertBefore($.parseHTML("<i class='giveaway__icon fa fa-windows'></i>")[0], next);
		}
		if (platforms.mac) {
			parent.insertBefore($.parseHTML("<i class='giveaway__icon fa fa-apple'></i>")[0], next);
		}
		if (platforms.linux) {
			parent.insertBefore($.parseHTML("<i class='giveaway__icon fa fa-linux'></i>")[0], next);
		}
	}
});


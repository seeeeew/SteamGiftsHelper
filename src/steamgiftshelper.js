$(function() {
	"use strict";
	
	var xsrf_token = $("[name=xsrf_token]")[0].value;
	
	// replace hiding form with ajax
	(function ajax_hiding() {
		var form = $(".popup--hide-games form");
		var div = $("<div>" + form.html() + "</div>");
		form.replaceWith(div);
		$(".popup--hide-games .form__submit-button")[0].onclick = click_ajax_hide;
	})();
	
	function click_ajax_hide() {
		var game_id = $(".popup--hide-games [name=game_id]")[0].value;
		$.ajax({
			method: "POST",
			url: "",
			data: "xsrf_token=" + xsrf_token + "&do=hide_giveaways_by_game_id&game_id=" + game_id,
			context: this,
			beforeSend: function() {
				$(this).children(".fa").removeClass("fa-check-circle");
				$(this).children(".fa").addClass("fa-spin fa-refresh");
			}
		}).done(function() {
			$("[data-game-id=" + game_id + "]").closest(".giveaway__row-outer-wrap").remove();
			$(".b-close").click();
			$(this).children(".fa").removeClass("fa-spin fa-refresh");
			$(this).children(".fa").addClass("fa-check-circle");
		});
	}
	
	// add platform icons
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
	
	// add enter/remove icon
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
				beforeSend: function() {
					$(this).removeClass("fa-plus-circle fa-minus-circle");
					$(this).addClass("fa-spin fa-refresh");
				}
			}).done(function(data) {
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


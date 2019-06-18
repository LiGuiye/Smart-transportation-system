$(document).ready(function() {

	$('.content').click(function(e) {
		e.stopPropagation();
	});
	// var selected = [];
	// $(".menu_list ul li .content .zcd").click(function() {
	// 	$(this).addClass("removes");
	// 	selected.push($(this).context.innerText);
	// 	console.log(selected);
	// });
	// $(".menu_list ul li .content .zcd").dblclick(function() {
	// 	$(this).removeClass("removes");
	// 	selected.remove($(this).context.innerText);
	// 	console.log(selected);
	// });

	// 点击隐藏
	$("#hidIcon").click(function() {
		$(".leftMenu").animate({
			"margin-left": "-220px"
		}, "slow", function() {
			$(".hidLeftMenu").css("display", "block");
			$(".leftMenu").css("display", "none")
		})
	})

	// 点击展开
	$(".openMenu").click(function() {
		$(".hidLeftMenu").css("display", "none");
		$(".leftMenu").css("display", "block").animate({
			"margin-left": "0px"
		}, "slow");
		// 默认直接展开图层列表
		var num = 0
		// $("#docName").click(function() {
		// 	if (num == 0) {
		// 		$("#content").animate({
		// 			height: 'show'
		// 		}, 1000).end().siblings().find(".content").hide(1000);
		// 		num++;
		// 	} else {
		// 		$("#content").animate({
		// 			height: 'hide'
		// 		}, 1000).end().siblings().find(".content").hide(1000);
		// 		num--;
		// 	}
		// })
		
		$(".fuMenu").click(function() {
			if (num == 0) {
				$(".fuMenu~.content").animate({
					height: 'show'
				}, 1000).end().siblings().find(".content").hide(1000);
				num++;
			} else {
				$(".fuMenu~.content").animate({
					height: 'hide'
				}, 1000).end().siblings().find(".content").hide(1000);
				num--;
			}
		})
	})
});


Array.prototype.remove = function(val) {
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};

//查询图层索引
var eventIndex = 3;
var sid;
//实现popup的html元素
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
//创建画圆控件
var drawCircle = new ol.interaction.Draw({
	type: "Circle",
});
//放属性表的tab
var tab1 = document.getElementById('tab1');
//图层数据源
var vectorSource = new ol.source.Vector();
//属性表点击跳转
$(document).on("click", "#tab1 tbody tr", function() {
	var sid = $(this).attr("value");
	var view = map.getView();
	view.setZoom(22);
	sid = sid.split(",");
	view.setCenter([Number(sid[0]), Number(sid[1])]);
});
//周边查询
function zbcxBegin() {
	tab1.innerHTML = null;
	document.getElementById("sstext").value = null;
	vectorSource.clear();
	map.addInteraction(drawCircle);
	//注册绘制结束的监听事件
	drawCircle.on('drawend', drawCircleControlback);
	/////////////////////////////////////////
	//在地图容器中创建一个Overlay
	popup = new ol.Overlay({
		//要转换成overlay的HTML元素
		element: container,
		//当前窗口可见
		autoPan: true,
		//Popup放置的位置
		positioning: 'bottom-center',
		//是否应该停止事件传播到地图窗口
		stopEvent: false,
		autoPanAnimation: {
			//当Popup超出地图边界时，为了Popup全部可见，地图移动的速度
			duration: 250
		}
	});
	map.addOverlay(popup);
	//添加关闭按钮的单击事件（隐藏popup）
	closer.onclick = function() {
		//未定义popup位置
		popup.setPosition(undefined);
		//失去焦点
		closer.blur();
		return false;
	};
	//为map添加鼠标移动事件监听，当指向标注时改变鼠标光标状态
	map.on('pointermove', function(e) {
		var pixel = map.getEventPixel(e.originalEvent);
		var hit = map.hasFeatureAtPixel(pixel);
		map.getTargetElement().style.cursor = hit ? 'pointer' : '';
	});
	vectorLayer = new ol.layer.Vector({
		crossOrigin: "Anonymous",
		source: vectorSource
	});
	map.addLayer(vectorLayer);
}

function zbcxClose() {
	document.getElementById("tab").style.zIndex = -9999;
	document.getElementById("searchbtn").style.zIndex = -222;
	tab1.innerHTML = null;
	document.getElementById("sstext").value = null;
	vectorSource.clear();
	// map.removeOverlay(popup);
	map.removeInteraction(drawCircle);
}
//执行画圆点击查询
function drawCircleControlback(data) {
	//初始化查询结构对象，设置查询结构包含几何信息
	var queryStruct = new Zondy.Service.QueryFeatureStruct();
	//是否包含几何图形信息
	queryStruct.IncludeGeometry = true;
	//是否包含属性信息
	queryStruct.IncludeAttribute = true;
	//是否包含图形显示参数
	queryStruct.IncludeWebGraphic = false;
	//创建一个用于查询的圆形状
	var geomObj = new Zondy.Object.Circle();
	geomObj.setByOL(data.feature.getGeometry());
	//指定查询规则
	var rule = new Zondy.Service.QueryFeatureRule({
		//是否将要素的可见性计算在内
		EnableDisplayCondition: true,
		//是否仅比较要素的外包矩形
		CompareRectOnly: false,
		//是否完全包含
		MustInside: false,
		//是否相交
		Intersect: true
	});
	//实例化查询参数对象
	var queryParam = new Zondy.Service.QueryParameter({
		geometry: geomObj,
		resultFormat: "json",
		struct: queryStruct,
		rule: rule
	});
	//设置查询分页号
	queryParam.pageIndex = 0;
	//设置查询要素数目
	queryParam.recordNumber = 20;
	//实例化地图文档查询服务对象
	var queryService = new Zondy.Service.QueryDocFeature(queryParam, docName, eventIndex, {
		//IP地址
		ip: ip,
		//端口号
		port: port
	});
	//执行查询操作，querySuccess为查询回调函数
	queryService.query(queryCircleSearchSuccess, queryError);
}
//搜索框模糊查询
function sscx() {
	document.getElementById("searchbtn").style.zIndex = 222;
	tab1.innerHTML = null;
	vectorSource.clear();
	var sstext = document.getElementById("sstext").value;
	var stext = "事件编号 LIKE '%" + sstext + "%' OR 驾驶员 LIKE '%" + sstext + "%' OR 处理状态 LIKE '%" + sstext +
		"%' OR 事件类型 LIKE '%" + sstext + "%' OR 事件等级 LIKE '%" + sstext + "%' OR 发生时间 LIKE '%" + sstext +
		"%' OR 发生地点 LIKE '%" + sstext + "%' OR 车牌号 LIKE '%" + sstext + "%'";
	//初始化查询结构对象，设置查询结构包含几何信息
	var queryStruct = new Zondy.Service.QueryFeatureStruct();
	//是否包含几何图形信息
	queryStruct.IncludeGeometry = true;
	//是否包含属性信息
	queryStruct.IncludeAttribute = true;
	//是否包含图形显示参数
	queryStruct.IncludeWebGraphic = false;
	//实例化查询参数对象
	var queryParam = new Zondy.Service.QueryParameter({
		resultFormat: "json",
		struct: queryStruct
	});
	//设置查询分页号
	queryParam.pageIndex = 0;
	//设置查询要素数目
	queryParam.recordNumber = 20;
	//设置属性条件
	queryParam.where = stext;
	//实例化地图文档查询服务对象
	var queryService = new Zondy.Service.QueryDocFeature(queryParam, docName, eventIndex, {
		ip: ip, //IP地址              
		port: port //端口号
	});
	//执行查询操作，querySuccess为查询回调函数
	queryService.query(queryCircleSearchSuccess, queryError);
}
//查询成功回调
function queryCircleSearchSuccess(result) {
	document.getElementById("tab").style.zIndex = 222;
	map.removeInteraction(drawCircle);
	if (result.TotalCount) {
		var sxsz = result.SFEleArray;
		var codes = "<thead>" +
			"<tr>" +
			"<th >事件编号</th>" +
			"<th>事件类型</th>" +
			"<th>事件等级</th>" +
			"<th>发生时间</th>" +
			"<th>发生地点</th>" +
			"<th>车牌号</th>" +
			"<th>驾驶员</th>" +
			"<th>处理状态</th>" +
			"</tr>" +
			"</thead>" +
			"<tbody>";
		for (i = 0; i < sxsz.length; i++) {
			var x = sxsz[i].fGeom.PntGeom["0"].Dot.x;
			var y = sxsz[i].fGeom.PntGeom["0"].Dot.y;
			zb = [x, y];
			var sxbg = result.SFEleArray[i].AttValue;
			var code = "";
			for (m = 0; m < sxbg.length - 1; m++) {
				code += "<td >" + sxbg[m] + "</td>";
			}
			codes += "<tr  value ='" + x + "," + y + "'>" + code + "</tr>";
			var featuerInfo = {
				geo: zb,
				att: {
					text: [sxbg], //标注内容
				}
			}
			//实例化Vector要素，通过矢量图层添加到地图容器中
			var iconFeature = new ol.Feature({
				geometry: new ol.geom.Point(zb), //坐标点
				attribute: featuerInfo
			});
			iconFeature.setStyle(createLabelStyle(iconFeature));
			//矢量标注的数据源
			vectorSource.addFeature(iconFeature);
		}
		codes += "</tbody>";
		$("#tab1").append(codes);
	} else {
		alert("未查询到要素！");
	}
}

//动态设置元素文本内容（兼容）
function setInnerText(element, text) {
	if (typeof element.textContent == "string") {
		element.textContent = text;
	} else {
		element.innerText = text;
	}
}

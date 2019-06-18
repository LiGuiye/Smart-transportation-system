var map, view, mapdoc;
var ip = "192.168.7.184";
var port = "6163";
var TiandiMap_vec = new ol.layer.Tile({
	name: "天地图矢量图层",
	source: new ol.source.XYZ({
		url: "http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=82793a95ac2fab6ddfe33ef84959b8db",
		wrapX: false
	})
});
var TiandiMap_img = new ol.layer.Tile({
	name: "天地图影像图层",
	source: new ol.source.XYZ({
		url: "http://t0.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=17639536739fc8adc5d0b8cd59fc2d3b",
		wrapX: false
	})
});

view = new ol.View({
	projection: 'EPSG:4326',
	zoom: 12,
	center: [(114.32110382470053 + 114.41798540197931) / 2, (30.46038194250228 + 30.52896194250228) / 2]
});
map = new ol.Map({
	target: "mapDiv",
	layers: [TiandiMap_vec, TiandiMap_img],
	view: view,
	controls: ol.control.defaults({
		attribution: false,
		rotate: false,
		zoom: false
	})
});
/////////////////// 功能封装//////////////////////////////
// 底图切换
function sl() {
	TiandiMap_vec.setVisible(true);
	TiandiMap_img.setVisible(false);
}

function yx() {
	TiandiMap_vec.setVisible(false);
	TiandiMap_img.setVisible(true);
}
//控件
var mousePositionControl = new ol.control.MousePosition({
	coordinateFormat: ol.coordinate.createStringXY(4),
	className: 'custom-mouse-position',
	target: document.getElementById('mouse-position'),
	undefinedHTML: '&nbsp;'
});
map.addControl(mousePositionControl);
//单击放大按钮功能
$('#zoomin').click(function() {
	var view = map.getView();
	var zoom = view.getZoom();
	view.setZoom(zoom + 1);
});
//单击缩小按钮功能
$('#zoomout').click(function() {
	var view = map.getView();
	var zoom = view.getZoom();
	view.setZoom(zoom - 1);
});
//复位功能（复位到初始状态）
//地图视图的初始参数
var viewRes = map.getView();
var zoomRes = viewRes.getZoom();
var centerRes = viewRes.getCenter();
$('#restore').click(function() {
	//获取地图视图
	var view = map.getView();
	//设置初始中心点
	view.setCenter(centerRes);
	//设置初始缩放级数
	view.setZoom(zoomRes);
});
//左侧目录树查询生成及联动
var docCatalog = new Zondy.Service.Catalog.MapDoc({
	ip: ip,
	port: port,
});
docCatalog.getMapDocList(getMapDocSuccess, getInfoError);

function getMapDocSuccess(data) {
	if (data.DOCNames.length > 0) {
		var create = '<li class="lis">';
		for (var i = 0; i < data.DOCNames.length; i++) {
			create += '<p class="fuMenu" id="docName">' + data.DOCNames[i] + '</p>';
		}
		create += '</li>';
		addMapDoc(data.DOCNames[0]);
		changeExtent(data.DOCNames[0])
		$('#list').append(create);
	} else {
		console.log("没看到地图文档")
	}
}

function getInfoError(data) {
	alert("请求失败，请检查参数！");
}

function addMapDoc(val) {
	mapdoc = new Zondy.Map.Doc(val, val, {
		ip: ip,
		port: port,
	});
	map.addLayer(mapdoc);
}

function changeExtent(docName) {
	getMapInfo(docName);
}

function getMapInfo(docName) {
	var docCatalog = new Zondy.Service.Catalog.MapDoc({
		ip: ip,
		port: port,
		docName: docName,
		mapIndex: 0,
	});
	docCatalog.getMapInfo(getMapInfoSuccess, false, false, getInfoError);
}
var list = '';

function getMapInfoSuccess(data) {
	var extent = data.range;
	extent = extent.split(',');
	view.fit(extent, map.getSize());
	map.setView(view);
	//获取图层列表
	if (data.subLayerNames.length > 0) {
		var create = '<div class="content" id="content">';
		list = '';
		for (var i = 0; i < data.subLayerNames.length; i++) {
			create += '<p class="zcd" value = "true" id = ' + i + '>' + data.subLayerNames[i] + '</p>';
		}
		list += '</div>';
		$('.lis').append(create);
		selectShow();
	} else {
		console.log("没看到图层")
	}
}

function selectShow() {
	var selected = [];
	$(".menu_list ul li .content .zcd").click(function() {

		if ($(this).context.classList[1] == "removes") {
			$(this).removeClass("removes");
			removeSelect(selected, $(this).context.id);
		} else {
			$(this).addClass("removes");
			selected.push($(this).context.id);
		}
		console.log(selected.toString());
		var result = selected.toString();
		if (selected.toString() == '') {
			result = 111111111
		}
		mapdoc.setLayerStatus(result, "show");
		mapdoc.refresh();
	});
}

function removeSelect(arry, val) {
	for (var key = 0; key < arry.length; key++) {
		if (arry[key] == val) {
			arry.splice(key, 1);
			key -= 1;
		}
	}
	return arry
};

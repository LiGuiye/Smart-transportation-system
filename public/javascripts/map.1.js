var map, view, mapdoc;
var ip = "192.168.7.183";
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
var measureSource = new ol.source.Vector();
var measureLayer =  new ol.layer.Vector({
	source: measureSource,
	style: new ol.style.Style({ //图层样式
		fill: new ol.style.Fill({
			color: 'rgba(255, 255, 255, 0.2)' //填充颜色
		}),
		stroke: new ol.style.Stroke({
			color: '#ffcc33', //边框颜色
			width: 2 // 边框宽度
		}),
		image: new ol.style.Circle({
			radius: 7,
			fill: new ol.style.Fill({
				color: '#ffcc33'
			})
		})
	})
});
map.addLayer(measureLayer);
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
	return arry;
};


//addInteraction(); //调用加载绘制交互控件方法，添加绘图进行测量


document.getElementById('dc').addEventListener('click', function() {
	map.once('postcompose', function(event) {
		var canvas = event.context.canvas;
		canvas.toBlob(function(blob) {
			saveAs(blob, 'map.png');
		});
	});
	map.renderSync();
});

function cd() {
	type = 'LineString';
	map.removeInteraction(draw);
	addInteraction();
}

function mj() {
	type = 'Polygon';
	map.removeInteraction(draw);
	addInteraction();
}

function tc() {
	map.removeInteraction(draw);
	drawSource.clear();
	if (measureTooltipElement) {
		var len = map.getOverlays().getLength();
		for (var i = len - 1; 0 <= i; i--) {
			if (map.getOverlays().getArray()[i].getElement().className === "tooltip tooltip-static") {
				map.removeOverlay(map.getOverlays().getArray()[i]);
			}
		}
		measureTooltipElement = null;
	}
	map.removeOverlay(measureTooltip);
	map.removeOverlay(helpTooltip);
}

/////實時路況///////////////////////////////
var arry = new Array();
arry[0] = new Zondy.Object.Point2D(114, 30);
arry[1] = new Zondy.Object.Point2D(115, 29);
addLine(arry);
//执行添加线要素功能
function addLine(arry) {
	//构成线要素的点

	//构成折线的弧段
	var gArc = new Zondy.Object.Arc(arry);
	//构成线的折线
	var gAnyLine = new Zondy.Object.AnyLine([gArc]);
	//设置线要素的几何信息
	var gline = new Zondy.Object.GLine(gAnyLine);
	//设置要素的几何信息
	var fGeom = new Zondy.Object.FeatureGeometry({
		LinGeom: [gline]
	});
	//随机输出1~8之间的整数,作为新添加的要素的颜色号
	var lineColor = 6; //6是紅色
	//设置添加线要素的图形参数信息
	var clineInfo = new Zondy.Object.CLineInfo({
		"Color": lineColor,
		"LinStyleID": 0,
		"LinStyleID2": 1,
		"LinWidth": 22,
		"Xscale": 10,
		"Yscale": 10
	}); //设置线要素的图形参数信息
	//设置要素的图形参数信息
	var graphicInfo = new Zondy.Object.WebGraphicsInfo({
		InfoType: 2, //2代表縣要素
		LinInfo: clineInfo
	});
	//设置添加线要素的属性信息
	var attValue = ['Yangtze', 124, '长江'];
	//创建一个线要素
	var newFeature = new Zondy.Object.Feature({
		fGeom: fGeom,
		GraphicInfo: graphicInfo,
		AttValue: attValue
	});
	//设置要素为线要素
	newFeature.setFType(2);

	//创建一个要素数据集
	var featureSet = new Zondy.Object.FeatureSet();
	var fldNumber = 3;
	var fldName = ["road", "vehicleflow", "datatimes"];
	var fldType = ["string", "long", "string"];
	//创建属性结构设置对象
	var cAttStruct = new Zondy.Object.CAttStruct({
		FldName: fldName,
		FldNumber: fldNumber,
		FldType: fldType
	});
	//设置要素数据集的树形结构
	featureSet.AttStruct = cAttStruct;
	//将添加的线要素添加到属性数据集中
	featureSet.addFeature(newFeature);

	//创建一个图层编辑对象
	var editLayerFeature = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/wuhan/sfcls/实时路况", {
		ip: "127.0.0.1",
		port: "6163"
	});
	editLayerFeature.add(featureSet, onLineSuccess);
}

//添加线要素回调函数
function onLineSuccess(rlt) {
	var result = rlt;
	if (result) {
		alert("添加线要素成功！");
		// vectorLayer.refresh();
	} else {
		alert("添加线要素失败！");
	}
}

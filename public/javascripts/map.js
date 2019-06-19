var map, view, mapdoc;
var TiandiMap_vec;
// 天地图影像
var TiandiMap_img;
// 测量数据源
var measureSource;
// 实时路况图层
var lukuangLayer;
//热力图图层
var heatmapVector;
var ip = "127.0.0.1";
var port = "6163";
$(function() {
	TiandiMap_vec = new ol.layer.Tile({
		name: "天地图矢量图层",
		source: new ol.source.XYZ({
			url: "http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=82793a95ac2fab6ddfe33ef84959b8db",
			wrapX: false
		})
	});
	TiandiMap_img = new ol.layer.Tile({
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
	//鼠标经纬度控件
	var mousePositionControl = new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(4),
		className: 'custom-mouse-position',
		target: document.getElementById('mouse-position'),
		undefinedHTML: '&nbsp;'
	});
	map.addControl(mousePositionControl);

	measureSource = new ol.source.Vector();
	var measureLayer = new ol.layer.Vector({
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
	//地图视图的初始参数
	var viewRes = map.getView();
	var zoomRes = viewRes.getZoom();
	var centerRes = viewRes.getCenter();
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
	$('#restore').click(function() {
		//获取地图视图
		var view = map.getView();
		//设置初始中心点
		view.setCenter(centerRes);
		//设置初始缩放级数
		view.setZoom(zoomRes);
	});
	// 导出地图
	document.getElementById('dc').addEventListener('click', function() {
		map.once('postcompose', function(event) {
			var canvas = event.context.canvas;
			canvas.toBlob(function(blob) {
				saveAs(blob, 'map.png');
			});
		});
		map.renderSync();
	});
	//左侧目录树查询生成及联动
	var docCatalog = new Zondy.Service.Catalog.MapDoc({
		ip: ip,
		port: port,
	});
	docCatalog.getMapDocList(getMapDocSuccess, getInfoError);

	// 实时路况
	// 单击标签生成或取消
	document.getElementById("lukuang").onclick = function() {
		if (document.getElementById("lukuang").className == "showLukuang") {
			removeLukuang();
			document.getElementById("lukuang").className = "hideLukuang";
		} else {
			lukuang();
			document.getElementById("lukuang").className = "showLukuang";
		}
	}

	document.getElementById("chart").onclick = function() {

		document.getElementById("myModalLabel").innerText = "事件统计图";
		document.getElementById("container").innerText = "";
		toechart();
	}

	document.getElementById("heatMap").onclick = function() {
		if (document.getElementById("heatMap").className == "showLukuang") {
			map.removeLayer(heatmapVector);
			document.getElementById("heatMap").className = "hideLukuang";
		} else {
			heatmap();
			document.getElementById("heatMap").className = "showLukuang";
		}
	}

});
/////////////////// 功能封装//////////////////////////////
// 底图切换
// 天地图矢量地图
function sl() {
	TiandiMap_vec.setVisible(true);
	TiandiMap_img.setVisible(false);
}
//天地图影像
function yx() {
	TiandiMap_vec.setVisible(false);
	TiandiMap_img.setVisible(true);
}
// 获取地图文档信息
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
//添加底图文档至底图
function addMapDoc(val) {
	mapdoc = new Zondy.Map.Doc(val, val, {
		ip: ip,
		port: port,
	});
	map.addLayer(mapdoc);
}
// 缩放至图层
function changeExtent(docName) {
	getMapInfo(docName);
}
//获取图层信息
function getMapInfo(docName) {
	var docCatalog = new Zondy.Service.Catalog.MapDoc({
		ip: ip,
		port: port,
		docName: docName,
		mapIndex: 0,
	});
	docCatalog.getMapInfo(getMapInfoSuccess, false, false, getInfoError);
}
// 生成左侧目录树
function getMapInfoSuccess(data) {
	var extent = data.range;
	extent = extent.split(',');
	view.fit(extent, map.getSize());
	map.setView(view);
	//获取图层列表
	if (data.subLayerNames.length > 0) {
		var create = '<div class="content" id="content">';
		for (var i = 0; i < data.subLayerNames.length; i++) {
			create += '<p class="zcd" value = "true" id = ' + i + '>' + data.subLayerNames[i] + '</p>';
		}
		create += '</div>';
		$('.lis').append(create);
		selectShow();
	} else {
		console.log("没看到图层")
	}
}
// 左侧选择图层时改变样式
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

//实时路况
function lukuang() {
	// 先删除原有路况,并添加至图层
	deleteLine()
	// 查询数据库更新路况并刷新
	selectLine();
	lukuangLayer.refresh();
}

function removeLukuang() {
	map.removeLayer(lukuangLayer);
}

function selectLine() {
	$.ajax({
		url: "/suoyou",
		context: document.body,
		success: function(data) {
			ajaxSuccess(data)
		}
	});
}

function ajaxSuccess(data) {
	var path = [];
	var point = [];
	var datetimes = [];
	var road = [];
	var vehicleflow = [];
	for (var i = 0; i < data.data.length; i++) {
		point[0] = new Zondy.Object.Point2D(data.data[i].path.split(',')[0], data.data[i].path.split(',')[1]);
		point[1] = new Zondy.Object.Point2D(data.data[i].path.split(',')[2], data.data[i].path.split(',')[3]);
		// 线起始点的位置和三个属性
		path[i] = [point[0], point[1]];
		datetimes[i] = data.data[i].datetimes;
		vehicleflow[i] = data.data[i].vehicleflow;
		road[i] = data.data[i].road;
	}
	for (var i = 0; i < path.length; i++) {
		addLine(path[i], datetimes[i], road[i], vehicleflow[i]);
	}
}

function deleteLine() {
	//执行删除要素操作
	var deleteService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/wuhan/sfcls/实时路况", {
		ip: ip,
		port: port
	});
	for (var i; i < 48; i++) {
		deleteService.deletes(i, onLineSuccess);
	}

	lukuangLayer = new Zondy.Map.Layer('', ['gdbp://MapGisLocal/wuhan/sfcls/实时路况'], {
		ip: ip,
		port: port
	});
	map.addLayer(lukuangLayer);
}
//执行添加线要素功能
function addLine(pointArry, datetimes, road, vehicleflow) {
	//构成折线的弧段
	var gArc = new Zondy.Object.Arc(pointArry);
	//构成线的折线
	var gAnyLine = new Zondy.Object.AnyLine([gArc]);
	//设置线要素的几何信息
	var gline = new Zondy.Object.GLine(gAnyLine);
	//设置要素的几何信息
	var fGeom = new Zondy.Object.FeatureGeometry({
		LinGeom: [gline]
	});
	//随机输出1~8之间的整数,作为新添加的要素的颜色号
	var lineColor;
	if (parseInt(vehicleflow) < 760) {
		lineColor = 7;
	} else if (parseInt(vehicleflow) < 1350) {
		lineColor = 4;
	} else {
		lineColor = 6;
	}
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
	var attValue = [road, vehicleflow, datetimes];
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
		ip: ip,
		port: port
	});
	editLayerFeature.add(featureSet, onLineSuccess);
}
//添加线要素回调函数
function onLineSuccess(rlt) {
	var result = rlt;
	if (result) {
		console.log("添加线要素成功！");
	} else {
		console.log("添加线要素失败！");
	}
}
// 统计图
function toechart() {
	//初始化查询结构对象，设置查询结构包含几何信息
	var queryStruct = new Zondy.Service.QueryFeatureStruct();
	queryStruct.IncludeGeometry = true;
	//实例化查询参数对象	
	var queryParam = new Zondy.Service.QueryParameter({
		resultFormat: "json",
		struct: queryStruct
	});
	queryParam.recordNumber = 100;
	//实例化地图文档查询服务对象
	var queryService = new Zondy.Service.QueryDocFeature(queryParam, "光谷智慧交通", 3, {
		ip: "localhost",
		port: "6163"
	});
	queryService.query(function success(data) {
		var Jan = Feb = Mar = Apr = May = June = July = Aug = Sep = Oct = Nov = Dec = 0;
		for (i = 0; i < data.SFEleArray.length; i++) {
			var myarray = data.SFEleArray[i].AttValue[3];
			var month = myarray.substr(5, 2);
			//          	document.write(month);            	
			if (month == "01") {
				Jan += 1;
			}
			if (month == "02") {
				Feb += 1;
			}
			if (month == "03") {
				Mar += 1;
			}
			if (month == "04") {
				Apr += 1;
			}
			if (month == "05") {
				May += 1;
			}
			if (month == "06") {
				June += 1;
			}
			if (month == "07") {
				July += 1;
			}
			if (month == "08") {
				Aug += 1;
			}
			if (month == "09") {
				Sep += 1;
			}
			if (month == "10") {
				Oct += 1;
			}
			if (month == "11") {
				Nov += 1;
			}
			if (month == "12") {
				Dec += 1;
			}
		}

		var chart = Highcharts.chart('container', {
			chart: {
				type: 'line'
			},
			title: {
				text: '2018年交通事故统计图'
			},
			xAxis: {
				categories: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
			},
			yAxis: {
				title: {
					text: '事故次数'
				}
			},
			plotOptions: {
				line: {
					dataLabels: {
						// 开启数据标签
						enabled: true
					},
					// 关闭鼠标跟踪，对应的提示框、点击事件不会失效
					enableMouseTracking: true
				}
			},
			series: [{
				name: '武汉光谷',
				data: [Jan, Feb, Mar, Apr, May, June, July, Aug, Sep, Oct, Nov, Dec]
			}]
		});
	});
}
// 热力图
function heatmap() {
	//初始化查询结构对象，设置查询结构包含几何信息
	var queryStruct = new Zondy.Service.QueryFeatureStruct();
	queryStruct.IncludeGeometry = true;
	//实例化查询参数对象	
	var queryParam = new Zondy.Service.QueryParameter({
		resultFormat: "json",
		struct: queryStruct
	});
	queryParam.where = "事件等级>0";
	//实例化地图文档查询服务对象
	var queryService = new Zondy.Service.QueryDocFeature(queryParam, "热力图", 0, {
		ip: "localhost",
		port: "6163"
	});
	queryService.query(function(result) {
		//初始化Zondy.Format.PolygonJSON类
		var format = new Zondy.Format.PolygonJSON();
		//将MapGIS要素JSON反序列化为ol.Feature类型数组
		var features = format.read(result);
		for (i = 0; i < features.length; i++) {
			var form = features[i].get("事件等级");
			features[i].set('weight', form - 5);
		}
		//Heatmap图层
		heatmapVector = new ol.layer.Heatmap({
			//矢量数据源（读取本地的KML数据）
			source: new ol.source.Vector({
				features: features
			}),
		});
		//将绘制图层添加到地图容器中
		map.addLayer(heatmapVector);
	});
}

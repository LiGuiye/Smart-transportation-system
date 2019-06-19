//地图文档名称
var docName = "光谷智慧交通";
//查询图层索引
var layerIndex = 2;
var zb;
var vidoe;
//创建绘图控件
var draw;
//矢量标注图层
var vectorLayer;
//弹框图层
var popup;
//设置红色icon标注的样式
var createLabelStyle = function(feature) {
			return new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [0.5, 1], //图片中心
					anchorOrigin: 'top-left', //标注样式的起点位置
					anchorXUnits: 'fraction', //X方向单位：分数
					anchorYUnits: 'fraction', //Y方向单位：分数		                        
					//opacity: 0.75,//透明度	
					//图标的url
					src: 'img/mark.png'
				}),
				text: new ol.style.Text({
					//位置
					textAlign: 'center',
					//基准线
					textBaseline: 'middle',
					//文字样式
					font: 'normal 14px 微软雅黑',
					//文本内容
					text: feature.get('name'),
					//文本填充样式（即文字颜色）
					fill: new ol.style.Fill({
						color: '#aa3300'
					}),
					stroke: new ol.style.Stroke({
						color: '#ffcc33',
						width: 2
					})
				})
			});
		}
//只显示摄像头图层
function cameraOpen() {
	//创建绘图控件
	draw = new ol.interaction.Draw({
		type: "Point",
	});
	map.addInteraction(draw);
	//注册绘制结束的监听事件
	draw.on('drawend', drawControlback);
}
function cameraClose() {
	map.removeInteraction(draw);
	map.removeLayer(vectorLayer);
	map.removeOverlay(popup);
	console.log("camera已关闭")
}
//执行点击查询
function drawControlback(data) {
	//初始化查询结构对象，设置查询结构包含几何信息
	var queryStruct = new Zondy.Service.QueryFeatureStruct();
	//是否包含几何图形信息
	queryStruct.IncludeGeometry = true;
	//是否包含属性信息
	queryStruct.IncludeAttribute = true;
	//是否包含图形显示参数
	queryStruct.IncludeWebGraphic = false;
	//创建一个用于查询的点形状
	var geomObj = new Zondy.Object.PointForQuery();
	geomObj.setByOL(data.feature.getGeometry());
	geomObj.nearDis = 0.005;
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
	var queryService = new Zondy.Service.QueryDocFeature(queryParam, docName, layerIndex, {
		//IP地址
		ip: ip,
		//端口号
		port: port
	});
	//执行查询操作，querySuccess为查询回调函数
	queryService.query(querySuccess, queryError);
}
//查询成功回调
function querySuccess(result) {
	
	//每点第二次的时候清除上一次的popup和icon
	document.getElementById("popup").style.opacity =1;
	map.removeLayer(vectorLayer);
	if (result.TotalCount) {
		//初始化Zondy.Format.PolygonJSON类
		var format = new Zondy.Format.PolygonJSON();
		//将MapGIS要素JSON反序列化为ol.Feature类型数组
		var features = format.read(result);
		var x = result.SFEleArray["0"].fGeom.PntGeom["0"].Dot.x;
		var y = result.SFEleArray["0"].fGeom.PntGeom["0"].Dot.y;
		var ars = "摄像头地址："+result.SFEleArray["0"].AttValue[2];
		if (result.SFEleArray["0"].AttValue[3] = "../../data/video/莲花新洲路口南段（190.192.11.134）.mp4") {
			video = "data/video/莲花新洲路口南段（190.192.11.134）.mp4";
			document.getElementById("videoTools").src = video;
		} else {
			video = "data/video/莲花新洲路口正中（190.192.11.134）.mp4";
			document.getElementById("videoTools").src = video;
		}
		document.getElementsByClassName("popup-content").innerText = ars;
		// popup的位置和内容信息
		zb = [x, y];
		var featuerInfo = {
			geo: zb,
			att: {
				text: ars,
			}
		}
		//实例化Vector要素，通过矢量图层添加到地图容器中
		var iconFeature = new ol.Feature({
			//坐标点
			geometry: new ol.geom.Point(zb),
			//名称属性
			name: '',
		});
		//设置icon的样式
		iconFeature.setStyle(createLabelStyle(iconFeature));
		//矢量标注的数据源
		var vectorSource = new ol.source.Vector({
			features: [iconFeature]
		});
		//矢量标注图层
		vectorLayer = new ol.layer.Vector({
			source: vectorSource
		});
		map.addLayer(vectorLayer);

		//实现popup的html元素
        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');
        var closer = document.getElementById('popup-closer');
		content.innerHTML = ars;
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
		popup.setPosition(zb);
		map.addOverlay(popup);
		//添加关闭按钮的单击事件（隐藏popup）
		closer.onclick = function() {
			// //未定义popup位置
			popup.setPosition(undefined);
			//失去焦点
			closer.blur();
			return false;
		};
	}
}

//查询失败回调
function queryError(e) {
	alert("查询失败!");
}

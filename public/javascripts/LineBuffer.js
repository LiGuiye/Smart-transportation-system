/*==========================================底图显示===================================================*/
var linshilujing;
var linshilujing1;
//缓存结果图层的基地址
var resultBaseUrl = "gdbp://MapGisLocal/wuhan/sfcls/";
/*============================================区域绘制===================================================*/
//绘制对象
var linedraw;
function addplogon() {
	
	//实例化一个矢量图层Vector作为绘制层
	var source = new ol.source.Vector({
		wrapX: false
	});
	var vector = new ol.layer.Vector({
		source: source,
		style: new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(255, 255, 255, 0.5)'
			}),
			stroke: new ol.style.Stroke({
				color: '#ffcc33',
				width: 2
			})
		})
	});
	//将绘制层添加到地图容器中
	map.addLayer(vector);
	source = new ol.source.Vector({
		wrapX: false
	});
	//添加绘制层数据源
	vector.setSource(source);
	var geometryFunction, maxPoints;
	//实例化交互绘制类对象并添加到地图容器中
	linedraw = new ol.interaction.Draw({
		//绘制层数据源
		source: source,
		type: "Polygon",
		//几何信息变更时调用函数
		geometryFunction: geometryFunction,
		//最大点数
		maxPoints: maxPoints
	});

	linedraw.on('drawend', function(e) {
		coordinates_Polygon = e.feature.getGeometry().getCoordinates();
		var pointObj = new Array();
		for (var i = 0; i < coordinates_Polygon[0].length; i++) {
			pointObj[i] = new Zondy.Object.Point2D(coordinates_Polygon[0][i][0], coordinates_Polygon[0][i][1]);
		}
		newback1(pointObj);

	});
	map.addInteraction(linedraw);

	function newback1(point) {
		//设置区要素的几何信息
		var gArc = new Zondy.Object.Arc(point);
		//构成区要素折线
		var gAnyLine = new Zondy.Object.AnyLine([gArc]);
		//构成区要素
		var gRegion = new Zondy.Object.GRegion([gAnyLine]);
		//构成区要素的几何信息
		var fGeom = new Zondy.Object.FeatureGeometry({
			RegGeom: [gRegion]
		});
		//随机输出1~1502之间的整数
		var fillColor = 8;

		//设置区要素的图形参数信息
		var cRegionInfo = new Zondy.Object.CRegionInfo({
			EndColor: 1,
			FillColor: fillColor,
			FillMode: 0,
			OutPenWidth: 1,
			OverMethod: 0,
			PatAngle: 1,
			PatColor: 1,
			PatHeight: 1,
			PatID: 27,
			PatWidth: 1
		});
		//要素图形参数信息
		var graphicInfo = new Zondy.Object.WebGraphicsInfo({
			InfoType: 3,
			RegInfo: cRegionInfo
		});

		//设置区要素的属性信息
		var attValue = ['ID' + getCurentTime()];

		//创建一个新的区要素
		var newFeature = new Zondy.Object.Feature({
			AttValue: attValue,
			fGeom: fGeom,
			GraphicInfo: graphicInfo
		});
		newFeature.setFType(3);

		//创建一个要素数据集
		var featureSet = new Zondy.Object.FeatureSet();
		var fldNumber = 3;
		var fldType = ["string"];
		var fldName = ["ID"];
		var cAttValue = new Zondy.Object.CAttStruct({
			FldNumber: fldNumber,
			FldType: fldType,
			FldName: fldName
		});
		featureSet.AttStruct = cAttValue;
		featureSet.addFeature(newFeature);


		var editDocFeature = new Zondy.Service.EditDocFeature("道路施工通知", 0, {
			ip: "127.0.0.1",
			port: "6163"
		});
		editDocFeature.add(featureSet, onPloySuccess);
	};
}

function onPloySuccess(rlt) {
	var result = rlt;
	if (result) {
		alert("区域选择成功！");
		// docLayer.refresh();
	} else {
		alert("区域选择失败！");
	}
}
/*============================================选中区裁剪光谷道路===================================================*/
//裁剪道路
function clipByLayerAnalysis1() {
	//清除之前的分析结果
	clearA();
	//显示进度条
	startPressBar();
	//实例化ClipByLayer类
	var resultname = "line" + getCurentTime();

	var clipParam = new Zondy.Service.ClipByLayer({
		ip: "localhost",
		port: "6163",
		//源简单要素类的URL
		srcInfo1: "gdbp://MapGisLocal/wuhan/sfcls/武汉光谷道路",
		//裁剪框简单要素类的URL
		srcInfo2: "gdbp://MapGisLocal/2/sfcls/裁剪区域",
		//设置结果URL
		desInfo: resultBaseUrl + resultname,

	});
	linshilujing1 = resultBaseUrl + resultname;
	//调用基类的execute方法，执行图层裁剪分析。AnalysisSuccess为结果回调函数
	clipParam.execute(AnalysisSuccess, "post", false, "json", AnalysisError);
}
//分析失败回调
function AnalysisError(e) {
	//停止进度条
	stopPressBar();
}
//分析成功后的回调
function AnalysisSuccess(data) {
	//停止进度条
	stopPressBar();
	if (!data.results) {
		alert("裁剪分析失败，请检查参数！");
	} else {
		if (data.results.length != 0) {
			alert("道路裁剪成功");
			var resultLayerUrl = data.results[0].Value;
			//将结果图层添加到地图视图中显示
			var resultLayer = new Zondy.Map.Layer("MapGIS IGS ClipAnalysisResultLayer", [resultBaseUrl + resultLayerUrl], {
				ip: "localhost",
				port: "6163",
				isBaseLayer: false
			});
			map.addLayer(resultLayer);
		}
	}
}
//缓冲区分析
function singleBuffAnalysis(anaType) {
	clearA();
	//显示进度条
	startPressBar();
	if (anaType == "rad") {
		//实例化ClassBufferBySingleRing类
		var clsBufBySR = new Zondy.Service.ClassBufferBySingleRing({
			ip: "localhost",
			port: "6163",
			//缓冲时要素左侧缓冲半径
			leftRad: 0.001,
			//缓冲时要素右侧缓冲半径
			rightRad: 0.001,
			//不允许根据属性字段设置缓冲区半径
			isByAtt: false
		});
	}
	//调用Zondy.Service.ClassBufferBase基类公共属性
	clsBufBySR.srcInfo = linshilujing1;
	var resultname = "buffer" + getCurentTime();
	clsBufBySR.desInfo = resultBaseUrl + resultname;

	linshilujing = clsBufBySR.desInfo;

	//调用基类Zondy.Service.AnalysisBase的execute方法执行类缓冲分析，AnalysisSuccess为回调函数
	clsBufBySR.execute(singleBuffAnalysisSuccess, "post", false, "json", AnalysisError);
}

function singleBuffAnalysisSuccess(data) {
	//停止进度条
	stopPressBar();
	if (!data.results) {
		alert("缓冲区分析失败，请检查参数！");
	} else {
		if (data.results.length != 0) {
			alert("缓冲区创建成功");
			var resultLayerUrl = data.results[0].Value;
			//将结果图层添加到地图视图中显示
			var resultLayer = new Zondy.Map.Layer("MapGIS IGS ClipAnalysisResultLayer", [resultBaseUrl + resultLayerUrl], {
				ip: "localhost",
				port: "6163",
				isBaseLayer: false
			});
			map.addLayer(resultLayer);
		}
	}
}
//裁剪结果
function clipByLayerAnalysis() {
	//清除之前的分析结果
	clearA();
	//显示进度条
	startPressBar();
	//实例化ClipByLayer类
	var resultname = "rlt" + getCurentTime();
	var clipParam = new Zondy.Service.ClipByLayer({
		ip: "localhost",
		port: "6163",
		//源简单要素类的URL
		srcInfo1: linshilujing,
		//裁剪框简单要素类的URL
		srcInfo2: "gdbp://MapGisLocal/wuhan/sfcls/居民区",
		//设置结果URL
		desInfo: resultBaseUrl + resultname
	});
	//调用基类的execute方法，执行图层裁剪分析。AnalysisSuccess为结果回调函数
	clipParam.execute(AnalysisSuccess, "post", false, "json", AnalysisError);
}
//清除客户端分析结果信息
function clearA() {
	//停止进度条
	stopPressBar();
	if (map.getLayers().array_.length > 1) {
		var i = map.getLayers().array_.length - 1;
		map.removeLayer(map.getLayers().array_[i]);
		map.removeInteraction(linedraw);
	} else
		return;
}
//获取当前时间（如：2015-09-09-120000）
//当前日期加时间(如:2009-06-12-120000)
function getCurentTime() {
	var now = new Date();
	//获取当前年份
	var year = now.getFullYear();
	//获取当前月份
	var month = now.getMonth() + 1;
	//获取当前日期
	var day = now.getDate();
	//获取当前时刻
	var hh = now.getHours();
	//获取当前分钟
	var mm = now.getMinutes();
	//获取当前秒钟
	var ss = now.getSeconds();
	//将当前的日期拼串
	var clock = year + "-";
	if (month < 10)
		clock += "0";
	clock += month + "-";
	if (day < 10)
		clock += "0";
	clock += day + "-";
	if (hh < 10)
		clock += "0";
	clock += hh;
	if (mm < 10) clock += '0';
	clock += mm;
	if (ss < 10) clock += '0';
	clock += ss;
	return (clock);
}
//进度条
//停止进度条
function stopPressBar() {
	document.getElementById('preview').style.display = "none";
}
//开始进度条动画
function startPressBar() {
	document.getElementById('preview').style.display = "";
};

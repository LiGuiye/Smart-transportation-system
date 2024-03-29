//创建绘图控件
var drawUpdate;
//点要素的id
var featureIds;
//"事件编号","事件类型","事件等级","发生时间","发生地点","车牌号","驾驶员","处理状态","mpLayer"
// 0:"string",1: "string",2: "short",3: "string",4: "string",5: "string",6: "string",7: "short",8: "long"
var num, type, level, time, address, carCode, driver, status, mpLayer;
//矢量标注图层
var updatevectorLayer;

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

//事件更新开启和关闭
//updateBegin();

//打开和关闭模态框
function openModal() {
	$('#myModal2').modal('show')
}

function closeModal() {
	$('#myModal2').modal('hide');
	//移除数据,应该没问题
	$("#myModal2").on("hidden.bs.modal", function() {
		$(this).removeData("bs.modal");
	});
}

//添加底图文档至底图
function addMapDoc(val) {
	mapdoc = new Zondy.Map.Doc(val, val, {
		crossOrigin: "Anonymous",
		ip: ip,
		port: port,
	});
	map.addLayer(mapdoc);
}
//事件更新开始
function updateBegin() {
	mapdoc.setLayerStatus("3", "show");
	mapdoc.refresh();
	interactionOpen();
}
function updateStop() {
	mapdoc.setLayerStatus("0,1,2,3", "show");
	mapdoc.refresh();
	// map.removeOverlay(popup);
	map.removeLayer(updatevectorLayer);
	interactionClose();
}
// 交互式查询开启
function interactionOpen() {
	//创建绘图控件
	drawUpdate = new ol.interaction.Draw({
		type: "Point",
	});
	map.addInteraction(drawUpdate);
	//注册绘制结束的监听事件
	drawUpdate.on('drawend', drawUpdateControlback);
}
// 交互式查询关闭
function interactionClose(){
	map.removeInteraction(drawUpdate);
}
//执行点击查询
function drawUpdateControlback(data) {
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
	var queryService = new Zondy.Service.QueryDocFeature(queryParam, docName, eventIndex, {
		//IP地址
		ip: ip,
		//端口号
		port: port
	});
	//执行查询操作，querySuccess为查询回调函数
	queryService.query(queryUpdateSuccess, queryError);
}
//查询成功回调
function queryUpdateSuccess(result) {
	map.removeLayer(updatevectorLayer);
	if (result.TotalCount) {
		//初始化Zondy.Format.PolygonJSON类
		var format = new Zondy.Format.PolygonJSON();
		//将MapGIS要素JSON反序列化为ol.Feature类型数组
		var features = format.read(result);
		//事件的各种详细信息
		featureIds = result.SFEleArray["0"].FID;
		num = result.SFEleArray["0"].AttValue["0"];
		type = result.SFEleArray["0"].AttValue["1"];
		level = result.SFEleArray["0"].AttValue["2"];
		time = result.SFEleArray["0"].AttValue["3"];
		address = result.SFEleArray["0"].AttValue["4"];
		carCode = result.SFEleArray["0"].AttValue["5"];
		driver = result.SFEleArray["0"].AttValue["6"];
		status = result.SFEleArray["0"].AttValue["7"];
		mpLayer = result.SFEleArray["0"].AttValue["8"];
		//popup的经纬度
		var x = result.SFEleArray["0"].fGeom.PntGeom["0"].Dot.x;
		var y = result.SFEleArray["0"].fGeom.PntGeom["0"].Dot.y;
		document.getElementById("querycontent").innerText = "事件详细信息";
		//popup的位置和内容信息
		zb = [x, y];
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
		updatevectorLayer = new ol.layer.Vector({
			crossOrigin: "Anonymous",
			source: vectorSource
		});
		map.addLayer(updatevectorLayer);

		//打开模态框并进行传值
		setModalData(num, type, level, time, address, carCode, driver, status, mpLayer);
		openModal();

	}
}

//查询失败回调
function queryError(e) {
	alert("查询失败!");
}
//给模态框传值
function setModalData(num, type, level, time, address, carCode, driver, status, mpLayer) {

	//"事件编号","事件类型","事件等级","发生时间","发生地点","车牌号","驾驶员","处理状态","mpLayer"
	var information = "<table class='table'><tbody>" +
		"<tr><td>" + "事件编号" + "</td><td>" + num +
		"</td></tr>" +
		"<tr><td>" + "事件类型" + "</td><td>" + type +
		"</td></tr>" +
		"<tr><td>" + "事件等级" + "</td><td>" + level +
		"</td></tr>" +
		"<tr><td>" + "发生时间" + "</td><td>" + time +
		"</td></tr>" +
		"<tr><td>" + "发生地点" + "</td><td>" + address +
		"</td></tr>" +
		"<tr><td>" + "车牌号" + "</td><td>" + carCode +
		"</td></tr>" +
		"<tr><td>" + "驾驶员" + "</td><td>" + driver +
		"</td></tr>" +
		"<tr><td>" + "处理状态" + "</td><td>" +
		// "<input type='text' class='form-control' id='status' placeholder=" + status +">"+
		// "</td></tr>" +
		"<select><option value ='0'>待处理</option>" +
		"<option value ='1'>处理中</option>" +
		"<option value='2'>已归档</option></select>" +
		"</tbody></table>";
	$("#querycontent")["0"].innerHTML = information;

}

function upload() {
	// 更新要素
	// 拿到现在点的位置和ID
	status = $("select option:selected")["0"].innerText
	var gpoint = new Zondy.Object.GPoint(zb[0], zb[1]);
	var fGeom = new Zondy.Object.FeatureGeometry({
		PntGeom: [gpoint]
	});
	//设置添加点要素的图形参数信息

	//描述点要素的符号参数信息
	//三种颜色的点要素
	var redPointInfo = new Zondy.Object.CPointInfo({
		Angle: 0,
		Color: 6,
		SymHeight: 5,
		SymID: 21,
		SymWidth: 5
	});
	var bluePointInfo = new Zondy.Object.CPointInfo({
		Angle: 0,
		Color: 2,
		SymHeight: 5,
		SymID: 21,
		SymWidth: 5
	});
	var greenPointInfo = new Zondy.Object.CPointInfo({
		Angle: 0,
		Color: 7,
		SymHeight: 5,
		SymID: 21,
		SymWidth: 5
	});
	var PointInfo;
	// 待处理：蓝0；处理中：红1；已归档：绿2
	if (status == "待处理") {
		PointInfo = bluePointInfo;
		status = 0;
	} else if (status == "处理中") {
		PointInfo = redPointInfo;
		status = 1;

	} else if (status == "已归档") {
		PointInfo = greenPointInfo;
		status = 2;

	}


	//设置当前点要素的图形参数信息
	var webGraphicInfo = new Zondy.Object.WebGraphicsInfo({
		InfoType: 1,
		PntInfo: PointInfo
	});
	//设置添加点要素的属性信息
	var attValue = [num, type, level, time, address, carCode, driver, status];
	//创建一个点要素
	var newFeature = new Zondy.Object.Feature({
		fGeom: fGeom, //要素几何图形信息
		GraphicInfo: webGraphicInfo, //要素图形参数信息
		AttValue: attValue //要素属性信息
	});
	//设置要素为点要素
	newFeature.setFType(1);
	newFeature.setFID(featureIds); //设置当前要素唯一标识FID
	//创建一个点要素数据集
	var featureSet = new Zondy.Object.FeatureSet();
	featureSet.clear();
	//设置属性结构
	var cAttStruct = new Zondy.Object.CAttStruct({
		FldName: ["事件编号", "事件类型", "事件等级", "发生时间", "发生地点", "车牌号", "驾驶员", "处理状态"],
		FldNumber: 8,
		FldType: ["string", "string", "short", "string", "string", "string", "string", "short", "long"]
	});
	featureSet.AttStruct = cAttStruct;
	//添加要素到要素数据集
	featureSet.addFeature(newFeature);
	var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/wuhan/sfcls/事件", {
		ip: ip,
		port: port
	});
	editService.update(featureSet, onSuccess);

	//更新完关闭
	closeModal();
}
//修改点要素回调函数
function onSuccess(result) {
	if (result) {
		alert("修改成功！");
		mapdoc.refresh();
	} else {
		alert("修改点要素失败！");
	}
}

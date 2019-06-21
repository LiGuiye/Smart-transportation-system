
var addEventTool;
function openModal3(){
	$('#myModal3').modal('show')
}
function closeModal3(){
	$('#myModal3').modal('hide')
}
function addEvent(){
	alert("请点击要添加的点");
	
	addEventTool = new ol.interaction.Draw({
		type: "Point",
	});
	map.addInteraction(addEventTool);
	//注册绘制结束的监听事件
	addEventTool.on('drawend', drawControlback);
	
	
	// map.on('click',cal);
	// function cal(data){
	// 	var zb = data.coordinate;
	// 	x1 = zb[0];
	// 	y1 = zb[1];
	// 	openModal3();
	// }
}
function addEventClose(){
	closeModal3();
	map.removeInteraction(addEventTool);
}
function drawControlback(data) {
	x1 = data.feature.values_.geometry.flatCoordinates[0];
	y1 = data.feature.values_.geometry.flatCoordinates[1];
	openModal3();
}
//添加点要素
function addPoint() {
    //创建一个点形状，描述点形状的几何信息
    var gpoint = new Zondy.Object.GPoint(x1, y1);
    //设置当前点要素的几何信息
    var fGeom = new Zondy.Object.FeatureGeometry({ PntGeom: [gpoint] });
    //描述点要素的符号参数信息
    var pointInfo = new Zondy.Object.CPointInfo({ Angle: 0, Color: 6, Space: 0, SymHeight: 5, SymID: 21, SymWidth: 5 });
    //设置当前点要素的图形参数信息
    var webGraphicInfo = new Zondy.Object.WebGraphicsInfo({ InfoType: 1, PntInfo: pointInfo });
    var a=document.getElementById("a").value;
    var b=document.getElementById("b").value;
    var c=document.getElementById("c").value;
    var d=document.getElementById("d").value;
    var e=document.getElementById("e").value;
    var f=document.getElementById("f").value;
    var g=document.getElementById("g").value;
	var h;
	if(document.getElementById("h").value == "待处理"){
		h = 0;
	}else if(document.getElementById("h").value == "处理中"){
		h = 1;
	}else if(document.getElementById("h").value == "已归档"){
		h = 2;
	}
    //设置添加点要素的属性信息        
    var attValue = [a,b,c,d,e,f,g,h];
    //创建一个要素
    var feature = new Zondy.Object.Feature({ fGeom: fGeom, GraphicInfo: webGraphicInfo, AttValue: attValue });
    //设置要素为点要素
    feature.setFType(1);
    //创建一个要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    featureSet.clear();
    //设置属性结构
    var cAttStruct = new Zondy.Object.CAttStruct({ FldName: ["事件编号", "事件类型", "事件等级","发生时间","发生地点","车牌号","驾驶员","处理状态"], FldNumber: 8, FldType: ["string", "string", "int","string", "string","string", "string","int"]});
    featureSet.AttStruct = cAttStruct;
    //添加要素到要素数据集
    featureSet.addFeature(feature);
    //创建一个编辑服务类
    var editService = new Zondy.Service.EditDocFeature("光谷智慧交通", 3, { ip:ip, port: port });
    //执行添加点要素功能
    editService.add(featureSet, onPntSuccess);
    closeModal3();
}
        
//添加点要素回调函数
function onPntSuccess(rlt) {
    var result = rlt;
    if (result) {
        alert("添加点要素成功！");
        mapdoc.refresh();
    } else {
        alert("添加点要素失败！");
    }
}
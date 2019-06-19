/*===========================================测量功能相关全局变量===================================================*/
// 测量数据源
// var measureSource;
// 测量绘制对象
var measureDraw;
/**
 * 当前绘制的要素（Currently drawn feature.）
 * @type {ol.Feature}
 */
var sketch;
/**
 * 帮助提示框对象（The help tooltip element.）
 * @type {Element}
 */
var helpTooltipElement;
/**
 *帮助提示框显示的信息（Overlay to show the help messages.）
 * @type {ol.Overlay}
 */
var helpTooltip;
/**
 * 测量工具提示框对象（The measure tooltip element. ）
 * @type {Element}
 */
var measureTooltipElement;
/**
 *测量工具中显示的测量值（Overlay to show the measurement.）
 * @type {ol.Overlay}
 */
var measureTooltip;
/**
 *  当用户正在绘制多边形时的提示信息文本
 * @type {string}
 */
var continuePolygonMsg = '鼠标单击绘制多边形';
/**
 * 当用户正在绘制线时的提示信息文本
 * @type {string}
 */
var continueLineMsg = '鼠标单击绘制线';
/**
 * 关闭测量工具
 */
function closeMeasureTool() {
    // 注销鼠标移动事件
    map.un('pointermove', pointerMoveHandler);
    // 清除测量数据源
    measureSource && measureSource.clear();
    // 移除测量绘制工具
    measureDraw && map.removeInteraction(measureDraw);
    measureDraw = null;
    if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        helpTooltipElement = null;
    }
    if (measureTooltipElement) {
        var len = map.getOverlays().getLength();
        for (var i = len - 1; 0 <= i; i--) {
            if (map.getOverlays().getArray()[i].getElement().className === "tooltip tooltip-static") {
                map.removeOverlay(map.getOverlays().getArray()[i]);
            }
        }
        measureTooltipElement = null;
    }
}
/**
 * 加载交互绘制控件函数
 * @param {string} type 测量类型分为距离测量、面积测量
 */
function openMeasureTool(type) {
    map.on('pointermove', pointerMoveHandler); //地图容器绑定鼠标移动事件，动态显示帮助提示框内容
    //地图绑定鼠标移出事件，鼠标移出时为帮助提示框设置隐藏样式
    $(map.getViewport()).on('mouseout', function () {
        $(helpTooltipElement).addClass('hidden');
    });
    // 移除测量绘制工具
    measureDraw && map.removeInteraction(measureDraw);
    measureDraw = new ol.interaction.Draw({
        source: measureSource,//测量绘制层数据源
        type: type,  //几何图形类型
        style: new ol.style.Style({//绘制几何图形的样式
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                })
            })
        })
    });
    map.addInteraction(measureDraw);

    createMeasureTooltip(); //创建测量工具提示框
    createHelpTooltip(); //创建帮助提示框

    var listener;
    //绑定交互绘制工具开始绘制的事件
    measureDraw.on('drawstart', function (evt) {
        // set sketch
        sketch = evt.feature; //绘制的要素
        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;// 绘制的坐标
        //绑定change事件，根据绘制几何类型得到测量长度值或面积值，并将其设置到测量工具提示框中显示
        listener = sketch.getGeometry().on('change', function (evt) {
            var geom = evt.target;//绘制几何要素
            var output;
            if (geom instanceof ol.geom.Polygon) {//面积
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates();//坐标
            } else if (geom instanceof ol.geom.LineString) {//长度
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();//坐标
            }
            measureTooltipElement.innerHTML = output;//将测量值设置到测量工具提示框中显示
            measureTooltip.setPosition(tooltipCoord);//设置测量工具提示框的显示位置
        });
    }, this);
    //绑定交互绘制工具结束绘制的事件
    measureDraw.on('drawend', function (evt) {
        measureTooltipElement.className = 'tooltip tooltip-static'; //设置测量提示框的样式
        measureTooltip.setOffset([0, -7]);
        sketch = null; //置空当前绘制的要素对象
        measureTooltipElement = null; //置空测量工具提示框对象
        createMeasureTooltip();//重新创建一个测试工具提示框显示结果
        ol.Observable.unByKey(listener);
    }, this);
}
/**
 * 鼠标移动事件处理函数
 * @param {ol.MapBrowserEvent} evt
 */
function pointerMoveHandler(evt) {
    if (evt.dragging) {
        return;
    }
    /** @type {string} */
    var helpMsg = '鼠标单击开始绘制';//当前默认提示信息
    //判断绘制几何类型设置相应的帮助提示信息
    if (sketch) {
        var geom = (sketch.getGeometry());
        if (geom instanceof ol.geom.Polygon) {
            helpMsg = continuePolygonMsg; //绘制多边形时提示相应内容
        } else if (geom instanceof ol.geom.LineString) {
            helpMsg = continueLineMsg; //绘制线时提示相应内容
        }
    }
    helpTooltipElement.innerHTML = helpMsg; //将提示信息设置到对话框中显示
    helpTooltip.setPosition(evt.coordinate);//设置帮助提示框的位置
    $(helpTooltipElement).removeClass('hidden');//移除帮助提示框的隐藏样式进行显示
};
/**
* 创建一个新的帮助提示框（tooltip）
*/
function createHelpTooltip() {
    if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
}
/**
* 创建一个新的测量工具提示框（tooltip）
*/
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');

    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    measureTooltip.cls == "MeasureTooltip"
    map.addOverlay(measureTooltip);
}

/**
* 测量长度输出
* @param {ol.geom.LineString} line
* @return {string}
*/
function formatLength(line) {
    //定义一个球对象
    var wgs84Sphere = new ol.Sphere(6378137);
    //解析线的坐标
    var coordinates = line.getCoordinates();
    //地图数据源投影坐标系
    var sourceProj = map.getView().getProjection();
    var length = 0;
    //通过遍历坐标计算两点之前距离，进而得到整条线的长度
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
        length += wgs84Sphere.haversineDistance(c1, c2);
    }
    var output;
    if (length > 100) {
        //换算成KM单位
        output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
    } else {
        //m为单位
        output = (Math.round(length * 100) / 100) + ' ' + 'm';
    }
    //返回线的长度
    return output;
};
/**
* 测量面积输出
* @param {ol.geom.Polygon} polygon
* @return {string}
*/
function formatArea(polygon) {
    //定义一个球对象
    var wgs84Sphere = new ol.Sphere(6378137);
    //地图数据源投影坐标系
    var sourceProj = map.getView().getProjection();
    //将多边形要素坐标系投影为EPSG:4326
    var geom = polygon.clone().transform(sourceProj, 'EPSG:4326');
    //解析多边形的坐标值
    var coordinates = geom.getLinearRing(0).getCoordinates();
    //获取面积
    var area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
    var output;
    if (area > 10000) {
        //换算成KM单位
        output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
    } else {
        //m为单位
        output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
    }
    //返回多边形的面积
    return output;
};
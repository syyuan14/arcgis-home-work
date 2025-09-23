# ArcGIS 美国地图应用

这是一个基于 ArcGIS JavaScript API 开发的美国地图应用，提供了州、县、城市和高速公路的可视化展示，并支持点击高速公路查询附近城市的功能。

## 功能特点

- 显示美国的州、县、城市和高速公路图层
- 点击高速公路可查询并显示其附近50公里范围内的城市
- 缓存查询结果到浏览器本地存储（IndexedDB）
- 高亮显示已缓存的城市（绿色标记）
- 在右侧面板显示附近城市列表，按距离排序
- 地图图例显示，帮助理解地图元素

## 技术栈

- ArcGIS JavaScript API 4.33
- HTML5, CSS3, JavaScript (ES6+)
- IndexedDB (浏览器本地存储)

## 目录结构

```
arcgis-home-work/
├── index.html         # 主HTML文件，定义页面结构
├── index.js           # 主入口文件，初始化地图和各图层
├── city-layer.js      # 城市图层相关功能
├── highways-layer.js  # 高速公路图层创建
├── states-layer.js    # 州图层创建
├── counties-layer.js  # 县图层创建
├── legend-layer.js    # 地图图例创建
└── style.css          # 样式文件
```

## 如何使用

### 前置条件
- 现代浏览器（Chrome等）

### 启动应用
1. 将项目文件下载到本地
2. 打开html文档，如果访问异常的话话请安装vscode open in browser 插件然后右键html文档在浏览器打开

### 使用说明
1. 地图加载完成后，可以看到美国的州、县、城市和高速公路
2. 点击地图上的任意一条高速公路
3. 右侧面板会显示该高速公路附近50公里内的城市列表，按距离排序
4. 地图上已缓存的城市会以绿色标记显示

### 示例页面
![示例页面](/assets/screenshot-20250923-213712.png)


## 代码架构说明

### 核心模块

#### 1. 主入口模块 (index.js)
- 负责初始化地图和地图视图
- 依次添加州、县、城市和高速公路图层
- 为地图视图添加点击事件监听器，处理高速公路点击事件
- 初始化图例控件

```javascript
// 初始化地图
async function initMap() {
  // 创建地图实例
  // 添加各图层
  // 创建地图视图
  // 添加事件监听器
}

// 启动应用
initMap();
```

#### 2. 城市图层模块 (city-layer.js)
- 创建城市图层
- 提供查找附近城市的功能
- 管理IndexedDB缓存
- 更新城市图层渲染器，使用UniqueValueRenderer高亮显示已缓存城市

主要函数：
- `createCityLayer()`: 创建并配置城市图层，使用SimpleRenderer和视觉变量根据人口显示不同大小
- `showCitiesNearHighway(highwayFeature, citiesLayer, view)`: 查找并显示高速公路附近的城市
- `updateCityLayerRendererForCachedCities(citiesLayer)`: 更新城市图层渲染器，使用UniqueValueRenderer为每个缓存城市ID添加唯一值信息
- `loadCachedCities()`: 从IndexedDB加载缓存的城市数据
- `saveCitiesData2IndexedDB(cities)`: 将城市数据保存到IndexedDB

#### 3. 其他图层模块
- `highways-layer.js`: 创建高速公路图层
- `states-layer.js`: 创建州图层
- `counties-layer.js`: 创建县图层
- 这些模块结构相似，主要提供创建对应图层的功能

#### 4. 图例模块 (legend-layer.js)
- 创建地图图例控件，将图例添加到地图的左下角

### 数据流程

1. 用户点击高速公路
2. 应用计算高速公路周围50公里的缓冲区
3. 查询该缓冲区内的所有城市
4. 计算每个城市到高速公路的距离并排序
5. 将查询结果保存到IndexedDB
6. 更新城市列表UI，显示附近城市
7. 更新城市图层渲染器，绿色显示已缓存城市

## 主要API使用

### ArcGIS API组件
- `Map`: 创建地图实例
- `MapView`: 创建地图视图
- `FeatureLayer`: 创建和配置图层
- `SimpleMarkerSymbol`: 定义点符号样式
- `UniqueValueRenderer`: 基于属性值渲染不同样式，为每个缓存城市添加唯一值信息
- `geometryEngine`: 进行几何计算（缓冲区、距离计算等）
- `Legend`: 创建地图图例控件

### 浏览器API
- `IndexedDB`: 浏览器本地存储API，用于缓存城市数据

## 注意事项
- 应用使用的是Esri提供的示例服务器数据
- 缓存的数据存储在浏览器的IndexedDB中，清除浏览器数据会导致缓存丢失
- 地图交互需要网络连接，首次加载可能需要一些时间
- 由于浏览器安全限制，本地直接打开HTML文件可能无法正常访问IndexedDB


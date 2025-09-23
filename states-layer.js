/**
 * 创建并配置州图层
 * @returns {FeatureLayer} 配置好的州图层实例
 */
export async function createStatesLayer() {
  // 州图层的URL
  const statesLayerUrl = 
    "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2";
  const FeatureLayer = await $arcgis.import(
    "@arcgis/core/layers/FeatureLayer.js"
  );

  // 创建州图层
  const statesLayer = new FeatureLayer({
    url: statesLayerUrl,
    // 配置图层属性
    title: "美国州",
    visible: true,
    outFields: ["*"], // 获取所有字段
  });

  return statesLayer;
}
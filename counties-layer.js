
export async function createCountiesLayer() {
  
  const countiesLayerUrl = 
    "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3";
  const FeatureLayer = await $arcgis.import(
    "@arcgis/core/layers/FeatureLayer.js"
  );

  
  const countiesLayer = new FeatureLayer({
    url: countiesLayerUrl,
    title: "美国县",
    visible: true,
    outFields: ["*"], 
  });

  return countiesLayer;
}
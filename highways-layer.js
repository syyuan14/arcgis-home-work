export async function createHighwaysLayer() {
  const highwaysLayerUrl =
    "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1";
  const FeatureLayer = await $arcgis.import(
    "@arcgis/core/layers/FeatureLayer.js"
  );

  const highwaysLayer = new FeatureLayer({
    url: highwaysLayerUrl,

    title: "美国高速公路",
    visible: true,
    outFields: ["*"],
  });

  return highwaysLayer;
}

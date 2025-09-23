export async function createLegend(view) {
  try {
    const Legend = await $arcgis.import("@arcgis/core/widgets/Legend.js");

    // get all layers in the map
    const layers = view.map.allLayers;

    // build layerInfos configuration to control legend display
    const layerInfos = [];

    // filter layers to exclude city layer
    layers.forEach((layer) => {
      if (layer.title && layer.title.includes("美国城市")) {
        return;
      } else {
        layerInfos.push({
          layer: layer,
        });
      }
    });

    const legend = new Legend({
      view: view,
      layerInfos: layerInfos,
    });

    view.ui.add(legend, "bottom-left");

    return legend;
  } catch (error) {
    console.error("create legend error:", error);
  }
}

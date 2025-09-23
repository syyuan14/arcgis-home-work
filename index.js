
import {
  createCityLayer,
  showCitiesNearHighway,
  updateCityLayerRendererForCachedCities,
} from "./city-layer.js";
import { createHighwaysLayer } from "./highways-layer.js";
import { createStatesLayer } from "./states-layer.js";
import { createCountiesLayer } from "./counties-layer.js";
import { createLegend } from "./legend-layer.js";

// 初始化地图
async function initMap() {
  try {
    
    const Map = await $arcgis.import("@arcgis/core/Map.js");
    const MapView = await $arcgis.import("@arcgis/core/views/MapView.js");
    const Extent = await $arcgis.import("@arcgis/core/geometry/Extent.js");
    const SpatialReference = await $arcgis.import(
      "@arcgis/core/geometry/SpatialReference.js"
    );

    // create map instance
    const map = new Map({
      basemap: "gray-vector",
    });

    // create states layer
    const statesLayer = await createStatesLayer();
    map.add(statesLayer);

    // create counties layer
    const countiesLayer = await createCountiesLayer();
    map.add(countiesLayer);

    // create cities layer
    const citiesLayer = await createCityLayer();
    map.add(citiesLayer);

    // create highways layer
    const highwaysLayer = await createHighwaysLayer();
    map.add(highwaysLayer);

    // create map view
    const view = new MapView({
      container: "mapContainer",
      map: map,
      extent: new Extent({
        xmin: -173.24789851593732,
        ymin: -69.43544422133593,
        xmax: -16.2692137558099,
        ymax: 109.10900234289849,
        spatialReference: new SpatialReference({ wkid: 4326 }),
      }),
      constraints: {
        geometry: new Extent({
          xmin: -178.21759838199998,
          ymin: 18.921786346000033,
          xmax: -66.96927110499996,
          ymax: 71.40623554800004,
          spatialReference: new SpatialReference({ wkid: 4326 }),
        }),
        minScale: 0,
        maxScale: 0,
      },
    });

    
    view
      .when(async function () {
        await updateCityLayerRendererForCachedCities(citiesLayer);

        await createLegend(view);

        // add click event listener to highways layer
        view.on("click", async function (event) {
          // 阻止默认的popup行为
          event.stopPropagation();
          event.preventDefault();

          // on click highways layer 
          const highwayFeatures = await view.hitTest(event, {
            include: [highwaysLayer],
            exclude: [citiesLayer, statesLayer, countiesLayer],
          });

          if (highwayFeatures.results.length > 0) {
            console.log("ysy click highways layer");
            const highwayFeature = highwayFeatures.results[0].graphic;
            await showCitiesNearHighway(highwayFeature, citiesLayer, view);
            
          } else {
            console.log("ysy click not highways layer");
          }
        });
      })
      .catch(function (error) {
        console.error("init map error:", error);
      });

    console.log("init done");
  } catch (error) {
    console.error("init map error:", error);
  }
}

// 启动应用
initMap();

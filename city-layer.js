async function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ArcGISCityData", 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("cities")) {
        db.createObjectStore("cities", { keyPath: "objectid" });
      }
    };

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

async function loadCachedCities() {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(["cities"], "readonly");
    const store = transaction.objectStore("cities");

    const cities = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
    return cities;
  } catch (error) {
    console.error("loadCachedCities error:", error);
    return [];
  }
}

const cityFeatures2Json = (cityFeatures) => {
  return cityFeatures.map((city) => ({
    objectid: city.attributes.objectid,
    name: city.attributes.name,
    population: city.attributes.pop2000 || 0,
    distance: city.attributes.distance || 0,
    geometry: city.geometry.toJSON(),
    attributes: { ...city.attributes },
    timestamp: new Date().getTime(),
  }));
};

async function saveCitiesData2IndexedDB(
  cityList,
  options = {
    clearHistoryData: true,
  }
) {
  try {
    const { clearHistoryData } = options;
    const db = await initDatabase();
    const transaction = db.transaction(["cities"], "readwrite");
    const store = transaction.objectStore("cities");

    if (clearHistoryData) {
      await new Promise((resolve,reject)=>{
        const request = store.clear();
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (e) => {
          reject(e);
        };
      })
    }
    cityList.forEach(async (city) => {
      await new Promise((resolve, reject) => {
        const request = store.put(city);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = (e) => {
          reject(e);
        };
      });
    });
  } catch (error) {
    console.error("saveCitiesData2IndexedDB error:", error);
  }
}

export async function createCityLayer() {
  // 城市图层的URL - 根据错误日志调整为MapServer/3
  const cityLayerUrl =
    "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/3";
  const FeatureLayer = await $arcgis.import(
    "@arcgis/core/layers/FeatureLayer.js"
  );

  const SimpleMarkerSymbol = await $arcgis.import(
    "@arcgis/core/symbols/SimpleMarkerSymbol.js"
  );

  const defaultSymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: [255, 255, 115, 255],
    outline: {
      color: [0, 0, 0, 255],
      width: 1,
    },
  });

  const cityLayer = new FeatureLayer({
    url: cityLayerUrl,
    title: "美国城市",
    visible: true,
    outFields: ["*"],

    renderer: {
      type: "simple",
      symbol: defaultSymbol,
      visualVariables: [
        {
          type: "size",
          field: "pop2000",
          normalizationField: null,
          stops: [
            {
              value: 10000,
              size: 4,
              label: "10,000",
            },
            {
              value: 100000,
              size: 8,
              label: "100,000",
            },
            {
              value: 1000000,
              size: 16,
              label: "1,000,000",
            },
          ],
        },
      ],
    },
  });

  return cityLayer;
}

export const updateCityListFromCache = async (citiesLayer) => {
  const cachedCities = await loadCachedCities();
  updateCityLayerRenderer(citiesLayer, cachedCities);
  updateCityList(cachedCities);
};

async function updateCityLayerRenderer(citiesLayer, cachedCities) {
  try {
    if (cachedCities.length === 0) {
      console.log("updateCityLayerRendererForCachedCities no data");
      return;
    }

    // uniq objectid
    const cachedCityIds = new Set(
      cachedCities.map((city) => city.objectid.toString())
    );

    const UniqueValueRenderer = await $arcgis.import(
      "@arcgis/core/renderers/UniqueValueRenderer.js"
    );
    const SimpleMarkerSymbol = await $arcgis.import(
      "@arcgis/core/symbols/SimpleMarkerSymbol.js"
    );

    const defaultSymbol = new SimpleMarkerSymbol({
      style: "circle",
      color: [255, 255, 115, 255],
      outline: {
        color: [0, 0, 0, 255],
        width: 1,
      },
    });

    // create cached city symbol
    const cachedCitySymbol = new SimpleMarkerSymbol({
      style: "circle",
      color: [0, 255, 0, 0.9], // green
      outline: {
        color: [0, 100, 0, 1],
        width: 1,
      },
    });

    const uniqueValueRenderer = new UniqueValueRenderer({
      field: "objectid",
      defaultSymbol: defaultSymbol,
      visualVariables: [
        {
          type: "size",
          field: "pop2000",
          stops: [
            { value: 10000, size: 4 },
            { value: 100000, size: 8 },
            { value: 1000000, size: 16 },
          ],
        },
      ],
    });

    // add cached city symbol

    cachedCityIds.forEach((id) => {
      try {
        uniqueValueRenderer.addUniqueValueInfo({
          value: id,
          symbol: cachedCitySymbol,
        });
      } catch (error) {
        console.warn(`add cached city symbol error: ${id}`, error);
      }
    });

    // apply unique value renderer to city layer
    citiesLayer.renderer = uniqueValueRenderer;
  } catch (error) {
    console.error("updateCityLayerRendererForCachedCities error:", error);
  }
}

export async function showCitiesNearHighway(highwayFeature, citiesLayer, view) {
  try {
    const GeometryEngine = await $arcgis.import(
      "@arcgis/core/geometry/geometryEngine.js"
    );

    const SEARCH_DISTANCE_KM = 50;

    // get highway geometry
    const highwayGeometry = highwayFeature.geometry;

    // create buffer area around highway
    const buffer = GeometryEngine.buffer(
      highwayGeometry,
      SEARCH_DISTANCE_KM,
      "kilometers"
    );

    // create query params
    const queryParams = {
      geometry: buffer,
      spatialRelationship: "intersects", // buffer area 与 city 几何形状相交
      outFields: ["*"],
      returnGeometry: true,
    };

    const queryResult = await citiesLayer.queryFeatures(queryParams);

    // calculate distance between city and highway
    const nearbyCities = [];

    for (const city of queryResult.features) {
      // calculate distance between city and highway
      const distance = GeometryEngine.distance(
        city.geometry,
        highwayGeometry,
        "meters"
      );

      // add distance to city attributes
      city.attributes.distance = distance;

      nearbyCities.push(city);
    }

    nearbyCities.sort((a, b) => a.attributes.distance - b.attributes.distance);
    const cityDataJson = cityFeatures2Json(nearbyCities);

    updateCityLayerRenderer(citiesLayer, cityDataJson);
    updateCityList(cityDataJson);

    // save cities data to indexed db
    await saveCitiesData2IndexedDB(cityDataJson);
  } catch (error) {
    console.error("showCitiesNearHighway error:", error);
  }
}

function updateCityList(cities) {
  const listElement = document.getElementById("city-list");

  if (!listElement) {
    return;
  }

  if (cities.length === 0) {
    listElement.innerHTML = "没有找到附近的城市";
    return;
  }

  // clear old list content
  while (listElement.firstChild) {
    listElement.removeChild(listElement.firstChild);
  }

  // create new list content
  const ul = document.createElement("ul");
  ul.style.listStyleType = "none";
  ul.style.padding = "0";
  ul.style.margin = "0";

  // sort cities by distance
  const sortedCities = [...cities].sort((a, b) => {
    return (a.attributes.distance || 0) - (b.attributes.distance || 0);
  });

  sortedCities.forEach((city) => {
    const li = document.createElement("li");
    li.style.padding = "8px";
    li.style.borderBottom = "1px solid #eee";
    li.style.cursor = "pointer";
    li.style.transition = "background-color 0.2s";

    // get city name
    const cityName = city.attributes.name || "未知城市";

    // format distance to km
    const distanceKm = (city.attributes.distance / 1000).toFixed(2);

    // set list item text content
    li.textContent = `${cityName} (距离: ${distanceKm} 公里)`;

    // add mouse hover effect
    li.addEventListener("mouseover", function () {
      this.style.backgroundColor = "#f5f5f5";
    });

    li.addEventListener("mouseout", function () {
      this.style.backgroundColor = "transparent";
    });

    ul.appendChild(li);
  });

  // add new list content
  listElement.appendChild(ul);
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Zoom from "@arcgis/core/widgets/Zoom";
import Expand from "@arcgis/core/widgets/Fullscreen";
import { LAYERS } from "../map-filters/map-filters";
import { createRoot } from "react-dom/client";

import "@arcgis/core/assets/esri/themes/light/main.css";

export const ArcgisMap = () => {
  const mapRef = useRef(null);
  const [allFeatureLayer, setAllFeatureLayer] = useState<
    {
      layer: FeatureLayer;
      url: string;
    }[]
  >([]);
  const [view, setView] = useState<MapView | null>(null);
  // 👇 ใช้ map เพื่อเก็บ root instance สำหรับ unmount ทีหลัง

  const map = useMemo(
    () =>
      new Map({
        basemap: "topo",
      }),
    []
  );

  useEffect(() => {
    if (!mapRef.current) return;
    const mapView = new MapView({
      container: mapRef.current,
      map: map,
      center: [100.5167, 13.75], // Default center coordinates (longitude, latitude)
      zoom: 9,
    });

    const zoomWidget = new Zoom({
      view: mapView,
    });

    const expandWidget = new Expand({
      view: mapView,
    });

    mapView.ui.add(zoomWidget, "top-right");
    mapView.ui.add(expandWidget, "top-right");
    setView(mapView);
  }, [map, mapRef]);

  const formatMap = useCallback(
    async (layerData: { url: string; title: string }) => {
      const layer = new FeatureLayer({
        ...(layerData.title === "ข้อมูลเขื่อน" && {
          renderer: {
            type: "simple",
            symbol: {
              type: "picture-marker",
              url: "https://cdn-icons-png.flaticon.com/512/10549/10549859.png", // URL ของไอคอน
              width: "32px",
              height: "32px",
            },
          },
        }),
        ...(layerData.title === "คาดการณ์การเกิดภัย (1 วัน)" && {
          renderer: {
            type: "simple",
            symbol: {
              type: "picture-marker",
              url: "https://cdn-icons-png.flaticon.com/512/10639/10639203.png", // URL ของไอคอน
              width: "32px",
              height: "32px",
            },
          },
        }),
        url: layerData.url,
        popupEnabled: true,
        popupTemplate: {
          title: layerData.title,
          content: (context: { graphic: __esri.Graphic }) => {
            const container = document.createElement("div");

            const root = createRoot(container);
            root.render(
              <MyPopupComponent attributes={context.graphic.attributes} />
            );

            return container;
          },
        },
        outFields: ["*"],
      });

      map.add(layer);

      layer.visible = false;
      return {
        layer,
        url: layerData.url,
      };
    },
    [map]
  );

  useEffect(() => {
    const loadLayer = async () => {
      const result = await Promise.all(LAYERS.map((item) => formatMap(item)));
      setAllFeatureLayer(result);
    };
    loadLayer();
  }, [map, formatMap]);

  const layer = LAYERS.map((item) => item.url);
  useEffect(() => {
    allFeatureLayer?.forEach((item) => {
      if (layer.includes(item.url)) {
        item.layer.visible = true;
      } else {
        item.layer.visible = false;
        if (view?.popup?.visible) {
          view.popup.visible = false;
        }
      }
    });
  }, [layer, allFeatureLayer, view]);

  return <div id="map" ref={mapRef} className="map w-full h-screen" />;
};

interface Props {
  attributes: __esri.Graphic["attributes"];
}

const MyPopupComponent: React.FC<Props> = ({ attributes }) => {
  const [data, setData] = useState<unknown>(null);
  const fethchData = useCallback(async () => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/todos/1`);
    const data = await res.json();
    return data;
  }, []);

  useEffect(() => {
    fethchData().then((data) => {
      setData(data);
    });
  }, [fethchData]);

  return (
    <div className="p-2 rounded space-y-4">
      <p>This is a React component</p>
      <div>
        <p>Attributes</p>
        <pre className="p-2 bg-neutral-200 rounded">
          {JSON.stringify(attributes, null, 2)}
        </pre>
      </div>
      <div>
        <p>Data fetch</p>
        <pre className="p-2 bg-neutral-200 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

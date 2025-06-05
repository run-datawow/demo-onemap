"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Zoom from "@arcgis/core/widgets/Zoom";
import Expand from "@arcgis/core/widgets/Fullscreen";
import { LAYERS } from "../map-filters/map-filters";

export const ArcgisMap = () => {
  const mapRef = useRef(null);
  const [allFeatureLayer, setAllFeatureLayer] = useState<
    {
      layer: FeatureLayer;
      url: string;
    }[]
  >([]);
  const [view, setView] = useState<MapView | null>(null);

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
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  label: "Mando",
                  fieldName: "Mando",
                },
              ],
            },
          ],
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

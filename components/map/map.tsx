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

  const popupRootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  let currentPopupPoint: __esri.Point | null = null;

  function showCustomReactPopup(attributes: unknown, mapPoint: __esri.Point) {
    const container = document.getElementById("custom-popup");
    if (!container) return;

    // แปลงตำแหน่งพิกัดบนแผนที่ → ตำแหน่งบนหน้าจอ
    const screenPoint = view?.toScreen(mapPoint); // <-- ใช้ view ที่ประกาศไว้ใน scope
    if (!screenPoint) return;
    // กำหนดตำแหน่งของ popup
    container.style.left = `${screenPoint.x - 320 / 2}px`;
    container.style.top = `${screenPoint.y}px`;
    container.style.display = "block";

    // Reuse or create the root instance
    if (!popupRootRef.current) {
      popupRootRef.current = createRoot(container);
    }

    popupRootRef.current.render(
      <ShowCustomReactPopup attributes={attributes} />
    );
  }

  function hidePopup() {
    const container = document.getElementById("custom-popup");
    if (container) {
      container.style.display = "none";
    }

    if (popupRootRef) {
      popupRootRef.current = null;
    }
  }

  function updatePopupPosition() {
    if (!currentPopupPoint) return;

    const container = document.getElementById("custom-popup");
    if (!container) return;

    const screenPoint = view?.toScreen(currentPopupPoint);
    container.style.left = `${Number(screenPoint?.x) - 320 / 2}px`;
    container.style.top = `${screenPoint?.y}px`;
  }

  view?.on("click", (event) => {
    view.hitTest(event).then((response) => {
      const result = response.results.find(
        (r): r is __esri.GraphicHit =>
          r.type === "graphic" &&
          allFeatureLayer
            .map((l) => l.layer.id)
            .includes(String(r.graphic.layer?.id))
      );

      if (result) {
        const attributes = result.graphic.attributes;
        showCustomReactPopup(attributes, event.mapPoint);
      } else {
        document.getElementById("custom-popup")!.style.display = "none";
      }
    });
  });

  view?.watch("extent", () => {
    updatePopupPosition();
  });

  view?.on("click", (event) => {
    view.hitTest(event).then((response) => {
      const hit = response.results.find(
        (r): r is __esri.GraphicHit => r.type === "graphic"
      );
      if (hit) {
        currentPopupPoint = event.mapPoint; // ✅ เก็บไว้ใช้ตอน map ขยับ
        showCustomReactPopup(hit.graphic.attributes, event.mapPoint);
      } else {
        currentPopupPoint = null;
        hidePopup();
      }
    });
  });

  return (
    <>
      <div
        id="custom-popup"
        className="absolute z-[999] hidden pointer-events-auto"
      >
        <div
          className="absolute -top-[8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white shadow-md"
          style={{
            filter:
              "drop-shadow(-2px 0 2px rgba(0,0,0,0.15)) drop-shadow(0 -2px 2px rgba(0,0,0,0.15))",
          }}
        />
      </div>
      <div id="map" ref={mapRef} className="map w-full h-screen" />
    </>
  );
};

interface Props {
  attributes: __esri.Graphic["attributes"];
}

const ShowCustomReactPopup: React.FC<Props> = ({ attributes }) => {
  return (
    <div
      id={attributes.objectid}
      className="bg-white p-4 rounded-md shadow-md max-w-xs space-y-2"
    >
      <p>Custom popup wit React Component</p>
      <pre className="overflow-auto bg-slate-100 p-4 rounded">
        {JSON.stringify(attributes, null, 2)}
      </pre>
    </div>
  );
};

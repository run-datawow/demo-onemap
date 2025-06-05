"use client";

import MapFilters from "@/components/map-filters";
import dynamic from "next/dynamic";

const ArcgisMap = dynamic(() => import("@/components/map"), {
  ssr: false,
});
export const MapContainer = () => {
  return (
    <>
      <MapFilters />
      <ArcgisMap />
    </>
  );
};

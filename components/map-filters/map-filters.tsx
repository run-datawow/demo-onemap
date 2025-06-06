export const LAYERS = [
  {
    title: "พื้นที่เกิดภัย",
    url: "https://gis-portal.disaster.go.th/arcgis/rest/services/Hosted/DevMap_SPR/FeatureServer/3",
  },
  {
    title: "คาดการณ์การเกิดภัย (1 วัน)",
    url: "https://gis-portal.disaster.go.th/arcgis/rest/services/Hosted/DevMap_SPR/FeatureServer/0",
  },
  {
    title: "ข้อมูลน้ำท่า",
    url: "https://gis-portal.disaster.go.th/arcgis/rest/services/Hosted/DevMap_SPR/FeatureServer/1",
  },
  {
    title: "ข้อมูลเขื่อน",
    url: "https://gis-portal.disaster.go.th/arcgis/rest/services/Hosted/DevMap_SPR/FeatureServer/2",
  },
];

export const MapFilters = () => {
  return (
    <div className="fixed top-3.5 left-3.5">
      <div className="w-2xs bg-white shadow rounded p-4">
        <p>Layers</p>
        <ul>
          {LAYERS.map((l) => (
            <li
              key={l.title}
              className="flex items-center"
              style={{ cursor: "pointer" }}
            >
              <input type="checkbox" className="mr-2" id={l.title} />
              <label htmlFor={l.title}>{l.title}</label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

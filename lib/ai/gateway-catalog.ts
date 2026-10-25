export type GatewaySource = {
  id: string;
  title: string;
  about: string;
};

/** Public series the Oregon gateway can return. Counts and readings only. */
export const GATEWAY_SOURCES: GatewaySource[] = [
  {
    about:
      "Median household income and median home value for every Oregon county.",
    id: "census_counties",
    title: "County income and home values",
  },
  {
    about: "Two-bedroom fair-market rent by county.",
    id: "hud_fmr",
    title: "Fair-market rent",
  },
  {
    about: "Liquor-license counts by county.",
    id: "olcc_counties",
    title: "Liquor licenses",
  },
  {
    about: "Active contractor-license counts by county.",
    id: "ccb_counties",
    title: "Contractor licenses",
  },
  {
    about: "Latest monthly unemployment rate for each Oregon county.",
    id: "laus_counties",
    title: "County unemployment",
  },
  {
    about: "Oregon statewide unemployment rate, labor force, and employment.",
    id: "qualityinfo",
    title: "Statewide unemployment",
  },
  {
    about:
      "Statewide residential, commercial, and industrial electricity prices.",
    id: "eia",
    title: "Electricity prices",
  },
  {
    about: "The 30-year mortgage rate and stored housing price series.",
    id: "fred",
    title: "Mortgage rate and housing",
  },
  {
    about: "Oregon personal income and income per person.",
    id: "bea",
    title: "Personal income",
  },
  {
    about: "National Weather Service forecast for the place in the question.",
    id: "nws_forecast",
    title: "Weather forecast",
  },
  {
    about: "Recent Oregon headlines on file.",
    id: "oregon_news",
    title: "Oregon headlines",
  },
  {
    about: "Current highway incidents and delays on file.",
    id: "tripcheck",
    title: "Highway incidents",
  },
];

export function catalogBrief(): string {
  return GATEWAY_SOURCES.map(
    (source) => `- ${source.id}: ${source.title}. ${source.about}`
  ).join("\n");
}

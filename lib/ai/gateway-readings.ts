import { GATEWAY_SOURCES } from "./gateway-catalog";

export type FoldSource = {
  id: string;
  note?: string;
};

const NOTE_LIMIT = 400;

type CountyReading = {
  contractors: string;
  home: string;
  income: string;
  liquor: string;
  name: string;
  rate: string;
  rent: string;
  unemploymentMonth: string;
  year: string;
};

const COUNTIES: CountyReading[] = [
  {
    contractors: "208",
    home: "247700",
    income: "57844",
    liquor: "101",
    name: "Baker",
    rate: "5.0",
    rent: "1014",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "732",
    home: "481700",
    income: "76011",
    liquor: "289",
    name: "Benton",
    rate: "4.5",
    rent: "1857",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "6005",
    home: "577900",
    income: "100360",
    liquor: "1235",
    name: "Clackamas",
    rate: "4.8",
    rent: "1878",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "665",
    home: "437800",
    income: "68705",
    liquor: "366",
    name: "Clatsop",
    rate: "4.6",
    rent: "1318",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "480",
    home: "390600",
    income: "86359",
    liquor: "146",
    name: "Columbia",
    rate: "5.7",
    rent: "1878",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "752",
    home: "302800",
    income: "60313",
    liquor: "258",
    name: "Coos",
    rate: "5.7",
    rent: "1173",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "444",
    home: "423300",
    income: "81675",
    liquor: "89",
    name: "Crook",
    rate: "5.6",
    rent: "1390",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "353",
    home: "366700",
    income: "64769",
    liquor: "152",
    name: "Curry",
    rate: "5.4",
    rent: "1379",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "4289",
    home: "596000",
    income: "87640",
    liquor: "978",
    name: "Deschutes",
    rate: "4.5",
    rent: "1893",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "1200",
    home: "283200",
    income: "58983",
    liquor: "508",
    name: "Douglas",
    rate: "6.1",
    rent: "1212",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "7",
    home: "158400",
    income: "64219",
    liquor: "13",
    name: "Gilliam",
    rate: "4.1",
    rent: "1014",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "99",
    home: "225100",
    income: "59800",
    liquor: "51",
    name: "Grant",
    rate: "5.6",
    rent: "1068",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "104",
    home: "190600",
    income: "48338",
    liquor: "52",
    name: "Harney",
    rate: "4.3",
    rent: "1014",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "375",
    home: "571200",
    income: "82095",
    liquor: "247",
    name: "Hood River",
    rate: "3.7",
    rent: "1888",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "3029",
    home: "400200",
    income: "71443",
    liquor: "1038",
    name: "Jackson",
    rate: "5.9",
    rent: "1539",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "257",
    home: "339200",
    income: "73051",
    liquor: "92",
    name: "Jefferson",
    rate: "5.5",
    rent: "1213",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "1140",
    home: "383100",
    income: "59097",
    liquor: "353",
    name: "Josephine",
    rate: "7.2",
    rent: "1331",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "695",
    home: "255700",
    income: "59353",
    liquor: "270",
    name: "Klamath",
    rate: "6.8",
    rent: "1134",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "94",
    home: "219400",
    income: "61222",
    liquor: "48",
    name: "Lake",
    rate: "5.5",
    rent: "1062",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "3848",
    home: "395800",
    income: "69311",
    liquor: "1372",
    name: "Lane",
    rate: "5.3",
    rent: "1546",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "848",
    home: "387700",
    income: "61314",
    liquor: "344",
    name: "Lincoln",
    rate: "5.7",
    rent: "1400",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "1422",
    home: "344600",
    income: "73396",
    liquor: "337",
    name: "Linn",
    rate: "5.3",
    rent: "1726",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "179",
    home: "221300",
    income: "49902",
    liquor: "120",
    name: "Malheur",
    rate: "4.0",
    rent: "1014",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "4689",
    home: "383300",
    income: "74624",
    liquor: "1108",
    name: "Marion",
    rate: "5.1",
    rent: "1692",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "72",
    home: "229800",
    income: "70217",
    liquor: "45",
    name: "Morrow",
    rate: "4.7",
    rent: "1014",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "6599",
    home: "528000",
    income: "86247",
    liquor: "4486",
    name: "Multnomah",
    rate: "5.1",
    rent: "1878",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "823",
    home: "419500",
    income: "81318",
    liquor: "221",
    name: "Polk",
    rate: "5.0",
    rent: "1692",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "13",
    home: "206700",
    income: "59500",
    liquor: "21",
    name: "Sherman",
    rate: "4.1",
    rent: "1214",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "512",
    home: "408600",
    income: "66551",
    liquor: "200",
    name: "Tillamook",
    rate: "4.9",
    rent: "1301",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "547",
    home: "256100",
    income: "68958",
    liquor: "319",
    name: "Umatilla",
    rate: "5.1",
    rent: "1131",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "311",
    home: "260500",
    income: "64212",
    liquor: "98",
    name: "Union",
    rate: "4.6",
    rent: "1114",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "149",
    home: "371900",
    income: "65559",
    liquor: "60",
    name: "Wallowa",
    rate: "4.5",
    rent: "1116",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "315",
    home: "332500",
    income: "63602",
    liquor: "153",
    name: "Wasco",
    rate: "5.3",
    rent: "1604",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "5458",
    home: "558500",
    income: "104434",
    liquor: "1620",
    name: "Washington",
    rate: "4.7",
    rent: "1878",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "16",
    home: "259000",
    income: "51250",
    liquor: "12",
    name: "Wheeler",
    rate: "3.8",
    rent: "1014",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
  {
    contractors: "1298",
    home: "442700",
    income: "87084",
    liquor: "960",
    name: "Yamhill",
    rate: "4.6",
    rent: "1878",
    unemploymentMonth: "August 2026",
    year: "2023",
  },
];

const STATEWIDE: Record<string, string> = {
  bea: "Oregon personal income, 2024: 302,582,283 thousand dollars. Oregon per capita personal income, 2024: $70,823.",
  eia: "Oregon electricity prices, August 2026: residential 15.92 cents, commercial 10.72 cents, industrial 8.75 cents per kilowatt-hour.",
  fred: "30-year fixed mortgage rate: 7.32 on 2026-10-22. Oregon house price index: 855.4 on 2026-04-01.",
  qualityinfo:
    "Oregon unemployment rate, September 2026: 5.0 percent, seasonally adjusted. Labor force 2,212,136. Employed 2,102,499. Unemployed 109,637.",
  tripcheck:
    "OR229: a landslide, closure. US26: sunken grade, estimated delay under 20 minutes. I84: road construction, estimated delay under 20 minutes. OR35: a fire, forest service roads closed.",
};

function money(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function count(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }
  return amount.toLocaleString("en-US");
}

function countiesNamed(text: string) {
  const folded = text.toLowerCase();
  return COUNTIES.filter((county) =>
    folded.includes(county.name.toLowerCase())
  );
}

function countyLines(id: string, counties: CountyReading[]) {
  return counties
    .map((county) => {
      if (id === "census_counties") {
        return `${county.name} County: median household income ${money(county.income)} and median home value ${money(county.home)}, ${county.year}.`;
      }
      if (id === "hud_fmr") {
        return `${county.name} County: two-bedroom fair-market rent ${money(county.rent)}.`;
      }
      if (id === "olcc_counties") {
        return `${county.name} County: ${count(county.liquor)} liquor licenses, read 2026-10-24.`;
      }
      if (id === "ccb_counties") {
        return `${county.name} County: ${count(county.contractors)} active contractor licenses, read 2026-10-24.`;
      }
      if (id === "laus_counties") {
        return `${county.name} County: unemployment ${county.rate} percent, ${county.unemploymentMonth}.`;
      }
      return "";
    })
    .filter(Boolean);
}

const CITY_COUNTY: Record<string, string> = {
  beaverton: "Washington",
  bend: "Deschutes",
  corvallis: "Benton",
  eugene: "Lane",
  "oregon city": "Clackamas",
  portland: "Multnomah",
  salem: "Marion",
  tigard: "Washington",
};

export function figuresForQuestion(question: string) {
  const folded = question.toLowerCase();
  const names = new Set<string>();
  for (const county of COUNTIES) {
    if (folded.includes(county.name.toLowerCase())) {
      names.add(county.name);
    }
  }
  for (const [city, countyName] of Object.entries(CITY_COUNTY)) {
    if (folded.includes(city)) {
      names.add(countyName);
    }
  }
  const [head, counties = ""] = oregonRecord().split("\n\n");
  if (names.size === 0) {
    return head;
  }
  const lines = counties
    .split("\n")
    .filter((line) =>
      [...names].some((name) =>
        line.toLowerCase().startsWith(name.toLowerCase())
      )
    );
  return [head, lines.join("\n")].filter(Boolean).join("\n\n");
}

export function oregonFigures(place?: string) {
  const [head, counties = ""] = oregonRecord().split("\n\n");
  const named = place?.trim();
  if (!named) {
    return oregonRecord();
  }
  const needle = named.toLowerCase().replace(/\s+county$/, "");
  const lines = counties
    .split("\n")
    .filter((line) => line.toLowerCase().includes(needle));
  return [head, lines.join("\n") || `No stored county line for ${named}.`].join(
    "\n\n"
  );
}

export function oregonRecord() {
  const counties = COUNTIES.map(
    (county) =>
      `${county.name}: unemployment ${county.rate} percent (${county.unemploymentMonth}); median income ${money(county.income)}; median home ${money(county.home)} (${county.year}); two-bedroom rent ${money(county.rent)}; liquor licenses ${count(county.liquor)}; contractor licenses ${count(county.contractors)}.`
  ).join("\n");
  return `${Object.values(STATEWIDE).join("\n")}\n\n${counties}`;
}

export function foldoverReadings(
  sources: FoldSource[] | undefined,
  context: string
) {
  if (!sources?.length) {
    return "";
  }
  const named = countiesNamed(context);
  const blocks: string[] = [];
  for (const source of sources) {
    const known = GATEWAY_SOURCES.find((item) => item.id === source.id);
    if (!known) {
      continue;
    }
    const note = source.note?.trim().slice(0, NOTE_LIMIT);
    const stored = [STATEWIDE[known.id], ...countyLines(known.id, named)]
      .filter(Boolean)
      .join("\n");
    blocks.push(
      [
        `${known.title}. ${known.about}`,
        stored,
        note ? `How to use it: ${note}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
  if (blocks.length === 0) {
    return "";
  }
  return [
    "The person checked these sources. Use a figure only when it is written here. If it is not, say it is not in the record we hold.",
    ...blocks,
  ].join("\n\n");
}

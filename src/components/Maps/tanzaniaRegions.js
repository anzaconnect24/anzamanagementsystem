// Where each Tanzanian region sits on a map, for plotting a startup by the
// region it recorded. Business.location is free text, so a lookup is by name
// and tolerant of case and stray spaces; anything it cannot place is returned
// as null and the caller says so rather than guessing a spot.
//
// Centres are the regional capitals, which is where a region's startups
// actually cluster. Unguja North and South are here because startups record
// them; they were missing from the older dashboard map's table.
export const REGION_CENTERS = {
  "Dar es Salaam": [-6.7924, 39.2083],
  Dodoma: [-6.1722, 35.7395],
  Arusha: [-3.3667, 36.6833],
  Mwanza: [-2.5167, 32.9],
  Zanzibar: [-6.1659, 39.2026],
  Tanga: [-5.0667, 39.1],
  Mbeya: [-8.9, 33.45],
  Morogoro: [-6.8219, 37.6614],
  Kilimanjaro: [-3.4, 37.35],
  Kigoma: [-4.8769, 29.6267],
  Mtwara: [-10.2667, 40.1833],
  Iringa: [-7.7667, 35.7],
  Lindi: [-9.9986, 39.7188],
  Geita: [-2.8736, 32.227],
  Kagera: [-1.856, 31.0271],
  Katavi: [-6.4217, 31.0673],
  Manyara: [-4.3134, 36.4965],
  Mara: [-1.7763, 34.1548],
  Njombe: [-9.3411, 34.772],
  Pwani: [-7.3232, 38.829],
  Rukwa: [-7.7084, 31.6112],
  Ruvuma: [-10.6854, 35.6535],
  Shinyanga: [-3.6619, 33.4235],
  Simiyu: [-2.8304, 34.0142],
  Singida: [-4.8166, 34.7439],
  Songwe: [-9.0347, 33.3935],
  Tabora: [-5.0143, 32.8139],
  "Pemba North": [-5.0333, 39.7833],
  "Pemba South": [-5.3167, 39.7333],
  "Mjini Magharibi": [-6.1631, 39.1991],
  "Unguja North": [-5.8667, 39.25],
  "Unguja South": [-6.1333, 39.2833],
};

// Mainland and the islands, with a little margin so edge markers are not
// clipped by the frame.
export const TANZANIA_BOUNDS = [
  [-11.9, 29.2],
  [-0.9, 40.6],
];

const byLowerName = new Map(
  Object.entries(REGION_CENTERS).map(([name, center]) => [name.toLowerCase(), center]),
);

export const regionCenter = (name) =>
  byLowerName.get(String(name || "").trim().toLowerCase()) || null;

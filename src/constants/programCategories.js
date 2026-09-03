// Every programme a startup can enrol in falls under exactly one of these.
// Used by the Admin add/edit form and by the category grid under Startups.
export const PROGRAM_CATEGORIES = [
  "Ideation",
  "Business Foundation Accelerator",
  "Investment Readiness Accelerator",
];

// Programmes with no category yet get their own tile so they stay reachable
// instead of disappearing from the grid.
export const UNCATEGORISED_KEY = "uncategorised";
export const UNCATEGORISED_LABEL = "Uncategorised";

// Blurb + artwork per category, for the tiles.
export const CATEGORY_META = {
  Ideation: {
    description: "Early-stage programmes turning an idea into a business.",
    image: "/images/ideation-classes.svg",
  },
  "Business Foundation Accelerator": {
    description: "Programmes building the foundations of a running business.",
    image: "/images/technology_innovation_card.svg",
  },
  "Investment Readiness Accelerator": {
    description: "Programmes preparing ventures to raise and absorb capital.",
    image: "/images/finance_fundraising_card.svg",
  },
  [UNCATEGORISED_LABEL]: {
    description: "Programmes that still need a category assigned.",
    image: "/images/business-tool-card.jpg",
  },
};

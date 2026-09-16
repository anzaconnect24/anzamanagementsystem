// When a startup counts as investment ready.
//
// The same definition the API applies (backend utils/crat_readiness.js), kept
// here for the screens that colour or label a score they already hold. Scores
// are percentages (0-100).

// At 70% and above a startup is investment ready.
export const INVESTMENT_READY_PERCENT = 70;

// Below that, 60% and above is close enough to be worth working with.
export const PARTIALLY_READY_PERCENT = 60;

const percentOf = (value) => {
  const percent = Number(value);
  return Number.isFinite(percent) ? percent : null;
};

export const isInvestmentReady = (value) => {
  const percent = percentOf(value);
  return percent !== null && percent >= INVESTMENT_READY_PERCENT;
};

export const readinessBand = (value) => {
  const percent = percentOf(value);
  if (percent === null) return "not_ready";
  if (percent >= INVESTMENT_READY_PERCENT) return "investment_ready";
  if (percent >= PARTIALLY_READY_PERCENT) return "partially_ready";
  return "not_ready";
};

// Plain English, for screens without translations.
export const readinessLabel = (value) =>
  ({
    investment_ready: "Investment Ready",
    partially_ready: "Partially Ready",
    not_ready: "Not Ready",
  })[readinessBand(value)];

// Translated, for screens that have a `t` function.
export const readinessLabelT = (value, t) =>
  ({
    investment_ready: t("report.investmentReady", "Investment Ready"),
    partially_ready: t("report.partiallyReady", "Partially Ready"),
    not_ready: t("report.notReady", "Not Ready"),
  })[readinessBand(value)];

// The colours the charts already use for each band.
export const readinessColor = (value) =>
  ({
    investment_ready: "#219654",
    partially_ready: "#f4dc2c",
    not_ready: "#EF4444",
  })[readinessBand(value)];

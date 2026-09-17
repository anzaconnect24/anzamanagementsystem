// A CSV file from rows, downloaded in the browser. Values are quoted so commas,
// quotes and line breaks in names and notes survive a spreadsheet import.
const cell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  // The byte-order mark lets Excel read accented names correctly.
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

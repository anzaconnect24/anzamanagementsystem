"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { TANZANIA_BOUNDS, regionCenter } from "./tanzaniaRegions";

const num = (value) => Number(value || 0).toLocaleString();

// The largest circle's radius. Everything else scales down from it by area.
const MAX_RADIUS = 28;
// Below this a circle is too small to see or hover, so it is held here.
const MIN_RADIUS = 5;

// Where a portfolio's startups are, as one circle per recorded location.
//
// Colour is the page's call: colorFor(location) returns a region's colour, so
// the map and the ranked list beside it always agree on which region is which.
// (A single `color` still works for a one-hue map.) Size carries the count,
// scaled by AREA (radius grows with the square root), so a region with four
// times the startups reads as four times as much ink rather than sixteen.
// Each circle has a 2px surface ring, which keeps overlapping coastal markers
// separable and lifts them off the sea where a fill alone falls under 3:1.
//
// Values are never tooltip-only: the page lists every location with its
// count beside the map, and this component only adds the spatial view.
const CoverageMap = ({ rows = [], total = 0, color, colorFor, ring = "#ffffff" }) => {
  const placed = rows
    .map((row) => ({ ...row, center: regionCenter(row.location) }))
    .filter((row) => row.center && row.businesses > 0)
    // Largest first, so the small circles are drawn last and sit on top where
    // they can still be hovered.
    .sort((a, b) => b.businesses - a.businesses);

  const unplaced = rows
    .filter((row) => !regionCenter(row.location))
    .reduce((sum, row) => sum + row.businesses, 0);

  const max = placed.reduce((most, row) => Math.max(most, row.businesses), 0);
  const radius = (count) =>
    max ? Math.max(MIN_RADIUS, MAX_RADIUS * Math.sqrt(count / max)) : MIN_RADIUS;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        bounds={TANZANIA_BOUNDS}
        // The dashboard scrolls; a map that swallows the wheel traps the page.
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {placed.map((row) => {
          const share = total ? Math.round((row.businesses / total) * 100) : 0;

          return (
            <CircleMarker
              key={row.location}
              center={row.center}
              radius={radius(row.businesses)}
              pathOptions={{
                color: ring,
                weight: 2,
                fillColor: colorFor ? colorFor(row.location) : color,
                fillOpacity: 0.85,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <span className="block text-sm font-bold text-black">
                  {row.location}
                </span>
                <span className="block text-xs text-[#52514e]">
                  {num(row.businesses)} {row.businesses === 1 ? "startup" : "startups"} &middot;{" "}
                  {share}% of portfolio
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Startups with no location, or one this map cannot place, are counted
          here rather than dropped - so the circles plus this note always add up
          to the portfolio. Above Leaflet's panes (z 400-700). */}
      {unplaced ? (
        <p className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-[#52514e] shadow-sm">
          {num(unplaced)} {unplaced === 1 ? "startup has" : "startups have"} no mappable location
        </p>
      ) : null}
    </div>
  );
};

export default CoverageMap;

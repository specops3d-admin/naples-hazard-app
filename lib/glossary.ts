/**
 * Plain-language term explanations taken from presentation.json wording.
 * Do not add definitions that are not supported by the working deck.
 */
export const GLOSSARY: Record<string, string> = {
  bradyseism:
    "Italian Civil Protection describes bradyseism as uplift/subsidence that is commonly followed by shallow, low-magnitude earthquakes.",
  caldera:
    "Campi Flegrei is a broad caldera, not a single cone; it has vents, craters, and hydrothermal areas embedded in the city and partly under western Naples and Pozzuoli Bay.",
  "pyroclastic flow":
    "Pyroclastic density currents are identified as the fastest and deadliest eruption hazard; evacuation is the main life-safety measure.",
  "pyroclastic density currents":
    "The fastest and deadliest eruption hazard; evacuation is the main life-safety measure.",
  liquefaction:
    "Most likely in low-lying coastal, alluvial, and reclaimed areas around the harbor and waterfront.",
  microzonation:
    "Used in Civil Protection vulnerability planning; the mitigation plan calls for updating seismic microzonation to rank buildings, schools, hospitals, port assets, and evacuation routes.",
  stratovolcano:
    "Vesuvius is described as a composite stratovolcano and a steep central volcano southeast of Naples.",
  hydrothermal:
    "Hydrothermal signs include fumaroles, gas release, ground uplift/subsidence, and shallow earthquakes that show the system is active.",
  "ash fall":
    "Ash / lapilli fall can cause roof collapse, poor air quality, transport shutdowns, water contamination, and power disruption.",
  seiche:
    "Harbor seiche is listed with tsunami as a lower-probability coastal water hazard that may follow offshore earthquakes, submarine landslides, or volcanic flank failure.",
};

export function glossaryEntriesForText(text: string) {
  const lower = text.toLowerCase();
  return Object.entries(GLOSSARY).filter(([term]) =>
    lower.includes(term.toLowerCase()),
  );
}

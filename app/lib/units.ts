// Mirrors my-home-backend's Unit enum (prisma/schema.prisma) exactly —
// keep the two in sync by hand.
export const UNITS = [
  "G",
  "KG",
  "ML",
  "L",
  "CUILLERE_A_CAFE",
  "CUILLERE_A_SOUPE",
  "PINCEE",
  "GOUSSE",
  "TRANCHE",
  "SACHET",
  "PAQUET",
  "BOITE",
  "POT",
  "BOUTEILLE",
  "TETE",
  "DOUZAINE",
  "MICHE",
  "UNITE",
] as const;

export type Unit = (typeof UNITS)[number];

const SINGULAR: Record<Unit, string> = {
  G: "g",
  KG: "kg",
  ML: "ml",
  L: "l",
  CUILLERE_A_CAFE: "cuillère à café",
  CUILLERE_A_SOUPE: "cuillère à soupe",
  PINCEE: "pincée",
  GOUSSE: "gousse",
  TRANCHE: "tranche",
  SACHET: "sachet",
  PAQUET: "paquet",
  BOITE: "boîte",
  POT: "pot",
  BOUTEILLE: "bouteille",
  TETE: "tête",
  DOUZAINE: "douzaine",
  MICHE: "miche",
  UNITE: "",
};

const PLURAL: Record<Unit, string> = {
  ...SINGULAR,
  CUILLERE_A_CAFE: "cuillères à café",
  CUILLERE_A_SOUPE: "cuillères à soupe",
  PINCEE: "pincées",
  GOUSSE: "gousses",
  TRANCHE: "tranches",
  SACHET: "sachets",
  PAQUET: "paquets",
  BOITE: "boîtes",
  POT: "pots",
  BOUTEILLE: "bouteilles",
  TETE: "têtes",
  DOUZAINE: "douzaines",
  MICHE: "miches",
};

export const UNIT_OPTIONS: { value: Unit; label: string }[] = UNITS.map((unit) => ({
  value: unit,
  label: unit === "UNITE" ? "Aucune (nombre seul)" : SINGULAR[unit],
}));

/** French label for a unit given a quantity — pluralized, "" for UNITE (a bare count). */
export function unitLabel(unit: Unit, quantity: string): string {
  return Number(quantity) === 1 ? SINGULAR[unit] : PLURAL[unit];
}

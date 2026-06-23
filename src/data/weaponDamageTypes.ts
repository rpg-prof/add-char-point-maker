/** Tipos de dano de arma (código AD&D). */
export const WEAPON_DAMAGE_TYPE_OPTIONS = [
  { code: "c", label: "Cortante" },
  { code: "p", label: "Perfurante" },
  { code: "e", label: "Esmagamento" },
  { code: "c/p", label: "Cortante / Perfurante" },
  { code: "p/c", label: "Perfurante / Cortante" },
  { code: "c/e", label: "Cortante / Esmagamento" },
  { code: "p/e", label: "Perfurante / Esmagamento" },
  { code: "e/p", label: "Esmagamento / Perfurante" },
] as const;

export function formatWeaponDamageType(code: string | undefined): string {
  if (!code || code === "-") return "—";
  return WEAPON_DAMAGE_TYPE_OPTIONS.find((o) => o.code === code)?.label ?? code;
}

export function weaponDamageTypeShort(code: string | undefined): string {
  if (!code || code === "-") return "";
  const SHORT: Record<string, string> = {
    c: "Cort.",
    p: "Perf.",
    e: "Esm.",
    "c/p": "C/P",
    "p/c": "P/C",
    "c/e": "C/E",
    "p/e": "P/E",
    "e/p": "E/P",
  };
  return SHORT[code] ?? code;
}

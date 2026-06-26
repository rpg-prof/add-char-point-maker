export interface MagicComponentEntry {
  item: string;
  qty: string;
}

export const DEFAULT_MAGIC_COMPONENT_ROWS = 6;

export function emptyMagicComponentRow(): MagicComponentEntry {
  return { item: "", qty: "" };
}

export function defaultMagicComponents(): MagicComponentEntry[] {
  return Array.from({ length: DEFAULT_MAGIC_COMPONENT_ROWS }, emptyMagicComponentRow);
}

export function normalizeMagicComponents(raw: unknown): MagicComponentEntry[] {
  if (Array.isArray(raw)) {
    const entries = raw
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const record = row as Record<string, unknown>;
        return {
          item: typeof record.item === "string" ? record.item : "",
          qty: typeof record.qty === "string" ? record.qty : "",
        };
      })
      .filter((row): row is MagicComponentEntry => row !== null);

    if (entries.length === 0) return defaultMagicComponents();
    while (entries.length < DEFAULT_MAGIC_COMPONENT_ROWS) {
      entries.push(emptyMagicComponentRow());
    }
    return entries;
  }

  if (typeof raw === "string" && raw.trim()) {
    const fromLines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.+?)\s*[×x:]\s*(\d.+)$/i);
        if (match) return { item: match[1].trim(), qty: match[2].trim() };
        return { item: line, qty: "" };
      });
    while (fromLines.length < DEFAULT_MAGIC_COMPONENT_ROWS) {
      fromLines.push(emptyMagicComponentRow());
    }
    return fromLines;
  }

  return defaultMagicComponents();
}

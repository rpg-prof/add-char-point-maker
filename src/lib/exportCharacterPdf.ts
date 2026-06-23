import jsPDF, { AcroFormTextField } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  generalAdvantages,
  generalDisadvantages,
  reputations,
  socialClasses,
  type AttributeName,
} from "@/data/characterData";
import { skills, getSkillCost } from "@/data/skills";
import {
  equipmentById,
  formatMoney,
  getRemainingCopper,
  getSpentCopper,
  getStartingCapitalPc,
  getTotalWeightKg,
  type CustomInventoryItem,
  type PurchasedItems,
} from "@/data/equipment";
import { parseCargaKg } from "@/data/currency";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import { getSubAttributeBonuses, subAttributeMap } from "@/data/subAttributes";
import { arcaneSpells, divineSpells, type Spell } from "@/data/spells";
import { stripMarkdown } from "@/lib/stripMarkdown";
import {
  computeArmorClassBreakdown,
  computeAttackRollBreakdown,
  computeHitPointsBreakdown,
  getMartialArtsDamageByLevel,
  hasArtesMarciais,
  resolveCurrentHp,
  sanitizeCombatLoadout,
  resolveWeaponById,
  type CombatLoadout,
  type WeaponAttackSlot,
} from "@/lib/combatStats";
import {
  computeSuggestedManaMax,
  computeSuggestedSpecialistManaMax,
  resolveResourceCurrent,
} from "@/lib/combatResources";
import { computeResistanceBreakdown } from "@/lib/resistanceStats";
import { mergeInventory } from "@/lib/inventory";

export interface ExportCharacterPdfInput {
  charName: string;
  playerName: string;
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  selectedReputation: number;
  characterLevel: number;
  sexo?: string;
  idade?: string;
  peso?: string;
  altura?: string;
  cabelos?: string;
  olhos?: string;
  tendencia?: string;
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  addedItems?: PurchasedItems;
  customItems?: CustomInventoryItem[];
  extraMoneyPc?: number;
  combatLoadout: CombatLoadout;
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedSkills: string[];
  selectedWeapons: string[];
  selectedWeaponGroups: string[];
  selectedShields: string[];
  grimoire: string[];
  divineAccess: Record<string, "minor" | "major">;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
  attributePointsSpent: number;
  characterPointsSpent: number;
  notesItems?: string;
  notesGeneral?: string;
  characterHistory?: string;
}

const formatSigned = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const SECTION_HEADER_H = 28;

function estimateTableHeight(
  bodyRows: number,
  opts: { rowH?: number; headH?: number; hasHead?: boolean } = {},
): number {
  const headH = opts.hasHead === false ? 0 : (opts.headH ?? 22);
  const rowH = opts.rowH ?? 17;
  return headH + Math.max(bodyRows, 0) * rowH + 4;
}

function getSlotDisplayName(
  slot: WeaponAttackSlot,
  isMartialArts: boolean,
  customItems: CustomInventoryItem[] = [],
): string {
  if (isMartialArts) return "Artes Marciais";
  if (slot.equipmentId) {
    return resolveWeaponById(slot.equipmentId, customItems)?.name ?? slot.name;
  }
  return slot.name.trim() || "—";
}

function getSkillCostForExport(skillName: string, characterClass: string): number {
  const skill = skills.find((s) => s.name === skillName);
  if (!skill) return 0;
  return getSkillCost(skill, characterClass);
}

const GOLD: [number, number, number] = [176, 141, 76];
const GOLD_LIGHT: [number, number, number] = [225, 200, 130];
const GOLD_DARK: [number, number, number] = [130, 98, 48];
const DARK: [number, number, number] = [40, 32, 24];
const INK: [number, number, number] = [40, 32, 24];
const MUTED: [number, number, number] = [110, 100, 88];
const BLOOD: [number, number, number] = [155, 40, 40];
const PAGE_BG: [number, number, number] = [252, 248, 240];
const CREAM: [number, number, number] = [245, 238, 225];
const STRIPE: [number, number, number] = [248, 244, 235];
const BORDER: [number, number, number] = [210, 195, 170];
const HEADER_BG: [number, number, number] = [28, 22, 16];
const PARCHMENT_BG: [number, number, number] = [248, 236, 205];
const PARCHMENT_EDGE: [number, number, number] = [218, 192, 148];
const PARCHMENT_BORDER: [number, number, number] = [120, 90, 50];
const PARCHMENT_INK: [number, number, number] = [55, 40, 25];
const PARCHMENT_MUTED: [number, number, number] = [95, 72, 48];

function drawCornerOrnament(
  doc: jsPDF,
  cx: number,
  cy: number,
  size: number,
  quadrant: 0 | 1 | 2 | 3,
) {
  const signs: [number, number][] = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  const [sx, sy] = signs[quadrant];
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.9);
  doc.line(cx, cy, cx + sx * size, cy);
  doc.line(cx, cy, cx, cy + sy * size);
  doc.setFillColor(...GOLD);
  doc.triangle(
    cx + sx * size * 0.55,
    cy + sy * size * 0.15,
    cx + sx * size * 0.15,
    cy + sy * size * 0.55,
    cx + sx * size * 0.7,
    cy + sy * size * 0.7,
    "F",
  );
}

function drawMainPageChrome(doc: jsPDF, pageW: number, pageH: number) {
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  const frame = 16;
  doc.setDrawColor(...GOLD_DARK);
  doc.setLineWidth(1.1);
  doc.rect(frame, frame, pageW - frame * 2, pageH - frame * 2);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.rect(frame + 4, frame + 4, pageW - (frame + 4) * 2, pageH - (frame + 4) * 2);

  const cs = 14;
  const pad = frame + 2;
  drawCornerOrnament(doc, pad, pad, cs, 0);
  drawCornerOrnament(doc, pageW - pad, pad, cs, 1);
  drawCornerOrnament(doc, pad, pageH - pad, cs, 2);
  drawCornerOrnament(doc, pageW - pad, pageH - pad, cs, 3);
}

function drawPageFooter(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  pageIndex: number,
  pageCount: number,
  isGrimoire: boolean,
) {
  const y = pageH - 22;
  doc.setDrawColor(...(isGrimoire ? PARCHMENT_BORDER : GOLD));
  doc.setLineWidth(0.5);
  doc.line(40, y, pageW - 40, y);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...(isGrimoire ? PARCHMENT_MUTED : MUTED));
  doc.text(
    "Gerado pelo Criador de Personagens AD&D 2.5",
    pageW / 2,
    y + 10,
    { align: "center" },
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...(isGrimoire ? PARCHMENT_BORDER : GOLD_DARK));
  doc.text(`${pageIndex} / ${pageCount}`, pageW - 44, y + 10, { align: "right" });
}

type GrimoireSpellEntry = {
  name: string;
  spell: Spell | null;
  isArcane: boolean;
};

function resolveGrimoireSpells(grimoire: string[]): GrimoireSpellEntry[] {
  const allSpells = [...arcaneSpells, ...divineSpells];
  return grimoire
    .slice()
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((name) => ({
      name,
      spell: allSpells.find((s) => s.name === name) ?? null,
      isArcane: arcaneSpells.some((s) => s.name === name),
    }));
}

function drawParchmentPage(doc: jsPDF, pageW: number, pageH: number) {
  doc.setFillColor(...PARCHMENT_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(240, 225, 190);
  for (let i = 0; i < 120; i++) {
    const px = 30 + (i * 47) % (pageW - 60);
    const py = 30 + (i * 83) % (pageH - 60);
    doc.circle(px, py, 0.4 + (i % 3) * 0.2, "F");
  }

  const edge = 16;
  doc.setFillColor(...PARCHMENT_EDGE);
  doc.rect(0, 0, pageW, edge, "F");
  doc.rect(0, pageH - edge, pageW, edge, "F");
  doc.rect(0, 0, edge, pageH, "F");
  doc.rect(pageW - edge, 0, edge, pageH, "F");

  const inset = 22;
  doc.setDrawColor(...PARCHMENT_BORDER);
  doc.setLineWidth(1.4);
  doc.rect(inset, inset, pageW - inset * 2, pageH - inset * 2);
  doc.setLineWidth(0.5);
  doc.rect(inset + 5, inset + 5, pageW - (inset + 5) * 2, pageH - (inset + 5) * 2);

  doc.setLineWidth(0.8);
  const curlY = inset + 2;
  for (let i = inset + 8; i < pageW - inset - 8; i += 14) {
    doc.line(i, curlY, i + 7, curlY + 3);
    doc.line(i + 7, curlY + 3, i + 14, curlY);
  }
  const bottomCurlY = pageH - inset - 2;
  for (let i = inset + 8; i < pageW - inset - 8; i += 14) {
    doc.line(i, bottomCurlY, i + 7, bottomCurlY - 3);
    doc.line(i + 7, bottomCurlY - 3, i + 14, bottomCurlY);
  }
}

function getSpellDetailLines(spell: Spell): string[] {
  const details: string[] = [];
  if (spell.range) details.push(`Alcance: ${spell.range}`);
  if (spell.duration) details.push(`Duração: ${spell.duration}`);
  if (spell.castingTime) details.push(`Conjuração: ${spell.castingTime}`);
  if (spell.components) details.push(`Componentes: ${spell.components}`);
  if (spell.area) details.push(`Área: ${spell.area}`);
  if (spell.savingThrow) details.push(`Resistência: ${spell.savingThrow}`);
  if (spell.source) details.push(`Fonte: ${spell.source}`);
  return details;
}

function measureWrappedLines(
  doc: jsPDF,
  lines: string[],
  maxWidth: number,
  lineHeight: number,
): number {
  let h = 0;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
    h += wrapped.length * lineHeight;
  }
  return h;
}

function measureSpellCardHeight(
  doc: jsPDF,
  entry: GrimoireSpellEntry,
  contentW: number,
): number {
  const pad = 10;
  const innerW = contentW - pad * 2;
  const detailLineH = 9;
  const descLineH = 9;
  let h = pad * 2 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(entry.name, innerW - 34) as string[];
  h += titleLines.length * 13 + 14;

  const spell = entry.spell;
  if (spell) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    h += measureWrappedLines(doc, getSpellDetailLines(spell), innerW, detailLineH);
    h += 6;
    doc.setFontSize(8);
    const desc = stripMarkdown(spell.description?.trim() || "") || "—";
    h += measureWrappedLines(doc, [desc], innerW, descLineH);
  } else {
    h += detailLineH + descLineH;
  }

  return h + 6;
}

function drawSpellCard(
  doc: jsPDF,
  entry: GrimoireSpellEntry,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const pad = 10;
  const spell = entry.spell;

  doc.setFillColor(255, 250, 238);
  doc.setDrawColor(...PARCHMENT_BORDER);
  doc.setLineWidth(0.9);
  doc.roundedRect(x, y, w, h, 4, 4, "FD");

  const badgeW = 28;
  const badgeH = 14;
  const badgeX = x + w - pad - badgeW;
  const badgeY = y + pad;
  doc.setFillColor(...PARCHMENT_BORDER);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 248, 230);
  doc.text(spell ? `${spell.level}º` : "—", badgeX + badgeW / 2, badgeY + 10, {
    align: "center",
  });

  let cy = y + pad + 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PARCHMENT_INK);
  doc.text(entry.name, x + pad, cy, { maxWidth: w - pad * 2 - badgeW - 6 });
  cy += 14;

  const schoolOrSphere = spell?.sphere ?? spell?.school ?? "—";
  const typeLabel = entry.isArcane ? "Arcana" : "Divina";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...PARCHMENT_MUTED);
  doc.text(`${schoolOrSphere} · ${typeLabel}`, x + pad, cy);
  cy += 12;

  if (spell) {
    doc.setFontSize(7.5);
    doc.setTextColor(...PARCHMENT_INK);
    const innerW = w - pad * 2;
    for (const detail of getSpellDetailLines(spell)) {
      const lines = doc.splitTextToSize(detail, innerW) as string[];
      doc.text(lines, x + pad, cy);
      cy += lines.length * 9;
    }

    cy += 2;
    doc.setDrawColor(...PARCHMENT_MUTED);
    doc.setLineWidth(0.3);
    doc.line(x + pad, cy, x + w - pad, cy);
    cy += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PARCHMENT_INK);
    const desc = stripMarkdown(spell.description?.trim() || "") || "—";
    const descLines = doc.splitTextToSize(desc, w - pad * 2) as string[];
    doc.text(descLines, x + pad, cy);
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...PARCHMENT_MUTED);
    doc.text("Detalhes não disponíveis.", x + pad, cy);
  }
}

function renderGrimoireSection(
  doc: jsPDF,
  grimoire: string[],
  pageW: number,
  pageH: number,
  margin: number,
): number | null {
  const entries = resolveGrimoireSpells(grimoire);
  if (entries.length === 0) return null;

  const contentW = pageW - margin * 2;
  const footerReserve = 36;
  const cardGap = 12;
  let y = margin + 44;
  let isFirstGrimoirePage = true;
  let startPage: number | null = null;

  const startGrimoirePage = () => {
    doc.addPage();
    if (startPage === null) startPage = doc.getNumberOfPages();
    drawParchmentPage(doc, pageW, pageH);
    y = margin + 44;
    if (isFirstGrimoirePage) {
      doc.setDrawColor(...PARCHMENT_BORDER);
      doc.setLineWidth(1);
      doc.line(margin + 40, margin + 32, pageW - margin - 40, margin + 32);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(...PARCHMENT_BORDER);
      doc.text("GRIMÓRIO / LIVRO DE ORAÇÕES", pageW / 2, margin + 16, {
        align: "center",
      });
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...PARCHMENT_MUTED);
      doc.text(
        `${entries.length} magia${entries.length === 1 ? "" : "s"} registrada${entries.length === 1 ? "" : "s"}`,
        pageW / 2,
        margin + 28,
        { align: "center" },
      );
      isFirstGrimoirePage = false;
    }
  };

  startGrimoirePage();

  for (const entry of entries) {
    const cardH = measureSpellCardHeight(doc, entry, contentW);
    if (y + cardH > pageH - footerReserve) {
      startGrimoirePage();
    }
    drawSpellCard(doc, entry, margin, y, contentW, cardH);
    y += cardH + cardGap;
  }

  return startPage;
}

export function exportCharacterPdf(input: ExportCharacterPdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  const addedItems = input.addedItems ?? {};
  const customItems = input.customItems ?? [];
  const extraMoneyPc = input.extraMoneyPc ?? 0;
  const inventory = mergeInventory(input.purchasedItems, addedItems);

  drawMainPageChrome(doc, pageW, pageH);

  // Sequential field naming to guarantee uniqueness
  let fieldSeq = 0;
  const addTextField = (opts: {
    value: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize?: number;
    align?: "left" | "center" | "right";
    multiline?: boolean;
    color?: [number, number, number];
  }) => {
    const f = new AcroFormTextField();
    f.fieldName = `f_${++fieldSeq}`;
    f.value = opts.value;
    f.defaultValue = opts.value;
    f.fontSize = opts.fontSize ?? 9;
    f.multiline = !!opts.multiline;
    f.x = opts.x;
    f.y = opts.y;
    f.width = opts.w;
    f.height = opts.h;
    f.textAlign = opts.align ?? "left";
    doc.addField(f);
  };

  const setColor = (rgb: [number, number, number]) =>
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const addMainPage = () => {
    doc.addPage();
    drawMainPageChrome(doc, pageW, pageH);
    y = margin;
  };

  const FOOTER_RESERVE = 36;
  const contentBottom = () => pageH - FOOTER_RESERVE;
  const maxBlockHeight = () => contentBottom() - margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > contentBottom()) {
      addMainPage();
    }
  };

  /** Mantém cabeçalho + conteúdo na mesma página quando o bloco inteiro couber. */
  const beginSection = (label: string, contentHeight: number) => {
    const blockH = SECTION_HEADER_H + contentHeight;
    if (blockH <= maxBlockHeight()) {
      ensureSpace(blockH);
    } else {
      ensureSpace(SECTION_HEADER_H + estimateTableHeight(1) + 8);
    }
    sectionHeader(label);
  };

  const tableBase = {
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: INK,
      lineColor: BORDER,
      lineWidth: 0.35,
    },
    headStyles: {
      fillColor: DARK,
      textColor: GOLD_LIGHT,
      fontStyle: "bold" as const,
      fontSize: 8,
      cellPadding: 5,
    },
    alternateRowStyles: { fillColor: STRIPE },
    rowPageBreak: "avoid" as const,
    showHead: "everyPage" as const,
    margin: { left: margin, right: margin, bottom: FOOTER_RESERVE },
  };

  const sectionHeader = (label: string) => {
    const barH = 18;
    doc.setFillColor(...CREAM);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y - 2, pageW - margin * 2, barH, 2, 2, "FD");

    doc.setFillColor(...GOLD);
    doc.rect(margin, y - 2, 4, barH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(GOLD_DARK);
    doc.text(label.toUpperCase(), margin + 10, y + 10);

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(margin + 10, y + barH + 2, pageW - margin - 10, y + barH + 2);
    y += barH + 10;
  };

  const drawLabeledField = (
    x: number,
    fieldY: number,
    w: number,
    label: string,
    value: string,
    fontSize = 9,
  ) => {
    const boxH = 22;
    doc.setFillColor(255, 252, 246);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.45);
    doc.roundedRect(x, fieldY, w, boxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setColor(GOLD_DARK);
    doc.text(label.toUpperCase(), x + 6, fieldY + 7);

    addTextField({
      value,
      x: x + 4,
      y: fieldY + 8,
      w: w - 8,
      h: boxH - 10,
      fontSize,
    });
  };

  /**
   * Replace cell content with an editable text field for the listed column
   * indexes. The default cell text is suppressed so the field shows the value.
   */
  const makeEditableHooks = (
    editableCols: number[],
    perColAlign?: Record<number, "left" | "center" | "right">,
  ) => ({
    willDrawCell: (data: CellHookData) => {
      if (data.section === "body" && editableCols.includes(data.column.index)) {
        // suppress default text — field will show value
        data.cell.text = [] as unknown as string[];
      }
    },
    didDrawCell: (data: CellHookData) => {
      if (data.section !== "body") return;
      if (!editableCols.includes(data.column.index)) return;
      const raw = data.cell.raw;
      const value = raw == null ? "" : String(raw);
      const pad = 1.5;
      addTextField({
        value,
        x: data.cell.x + pad,
        y: data.cell.y + pad,
        w: data.cell.width - pad * 2,
        h: data.cell.height - pad * 2,
        fontSize: (data.cell.styles.fontSize as number) ?? 9,
        align: perColAlign?.[data.column.index] ?? "left",
      });
    },
  });

  // ===== HEADER =====
  const headerH = 86;
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, pageW, headerH, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, headerH - 3, pageW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text("FICHA DE PERSONAGEM", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 140, 110);
  doc.text("AD&D 2.5", margin + 108, 18);

  const levelBadgeW = 52;
  const levelBadgeH = 36;
  const levelBadgeX = pageW - margin - levelBadgeW;
  doc.setFillColor(50, 40, 28);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.roundedRect(levelBadgeX, 14, levelBadgeW, levelBadgeH, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text("NÍVEL", levelBadgeX + levelBadgeW / 2, 26, { align: "center" });
  doc.setFontSize(16);
  doc.text(String(input.characterLevel), levelBadgeX + levelBadgeW / 2, 44, {
    align: "center",
  });

  doc.setFillColor(50, 40, 28);
  doc.roundedRect(margin, 26, pageW - margin * 2 - levelBadgeW - 12, 28, 3, 3, "F");
  addTextField({
    value: input.charName.trim() || "Personagem Sem Nome",
    x: margin + 8,
    y: 30,
    w: pageW - margin * 2 - levelBadgeW - 28,
    h: 22,
    fontSize: 17,
    align: "left",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text("JOGADOR", margin, 68);
  addTextField({
    value: input.playerName,
    x: margin + 52,
    y: 58,
    w: pageW - margin * 2 - 52,
    h: 14,
    fontSize: 9,
  });
  y = headerH + 14;

  // 4-col facts (label above, editable value below)
  const reputationLabel =
    reputations.find((r) => r.level === input.selectedReputation)?.description ?? "";
  const facts: { label: string; value: string }[] = [
    { label: "Raça", value: input.selectedRace || "" },
    { label: "Classe", value: input.selectedClass || "" },
    { label: "Classe Social", value: input.selectedSocialClass || "" },
    {
      label: "Reputação",
      value: `Nv ${input.selectedReputation}${reputationLabel ? ` — ${reputationLabel}` : ""}`,
    },
  ];
  const factGap = 6;
  const factW = (pageW - margin * 2 - factGap * 3) / 4;
  ensureSpace(30);
  facts.forEach((f, i) => {
    const fx = margin + i * (factW + factGap);
    drawLabeledField(fx, y, factW, f.label, f.value);
  });
  y += 30;

  const bioFields: { label: string; value: string }[] = [
    { label: "Sexo", value: input.sexo?.trim() ?? "" },
    { label: "Idade", value: input.idade?.trim() ?? "" },
    { label: "Tendência", value: input.tendencia?.trim() ?? "" },
    { label: "Peso", value: input.peso?.trim() ?? "" },
    { label: "Altura", value: input.altura?.trim() ?? "" },
    { label: "Cabelos", value: input.cabelos?.trim() ?? "" },
    { label: "Olhos", value: input.olhos?.trim() ?? "" },
  ].filter((f) => f.value);
  if (bioFields.length > 0) {
    const bioCols = Math.min(bioFields.length, 4);
    const bioGap = 6;
    const bioW = (pageW - margin * 2 - bioGap * (bioCols - 1)) / bioCols;
    for (let row = 0; row < Math.ceil(bioFields.length / bioCols); row++) {
      ensureSpace(30);
      const slice = bioFields.slice(row * bioCols, row * bioCols + bioCols);
      slice.forEach((f, i) => {
        const fx = margin + i * (bioW + bioGap);
        drawLabeledField(fx, y, bioW, f.label, f.value);
      });
      y += 30;
    }
    y += 4;
  }

  const loadout = sanitizeCombatLoadout(input.combatLoadout, inventory, customItems);
  const hasMagicAccess =
    Object.keys(input.divineAccess).length > 0 ||
    Object.keys(input.arcaneAccess).length > 0 ||
    input.arcaneSpecialist !== null;
  const artesMarciaisAtivas = hasArtesMarciais(input.selectedRaceClassAdv);
  const martialArtsDamage = getMartialArtsDamageByLevel(input.characterLevel);

  // ===== ATRIBUTOS =====
  const attrRows = subAttributeMap.map(({ main, sub1, sub2 }) => {
    const mv = input.attributes[main as AttributeName];
    const s1 = input.subAttributes[sub1] ?? mv;
    const s2 = input.subAttributes[sub2] ?? mv;
    return [main, String(mv), `${sub2}: ${s2}`, `${sub1}: ${s1}`];
  });
  beginSection("Atributos", estimateTableHeight(attrRows.length));
  autoTable(doc, {
    startY: y,
    head: [["Atributo", "Valor", "Sub", "Sub"]],
    body: attrRows,
    theme: "grid",
    ...tableBase,
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "center", cellWidth: 40, textColor: GOLD, fontStyle: "bold" },
    },
    ...makeEditableHooks([1, 2, 3], { 1: "center" }),
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // ===== RESISTÊNCIAS =====
  const resistances = computeResistanceBreakdown({
    subAttributes: input.subAttributes,
    selectedRaceClassAdv: input.selectedRaceClassAdv,
  });
  beginSection("Resistências", estimateTableHeight(resistances.length));
  autoTable(doc, {
    startY: y,
    head: [["Resistência", "Base", "Sub-Atrib.", "Mod.", "Vantagens", "Total"]],
    body: resistances.map((r) => [
      r.label,
      `${r.base}%`,
      `${r.subAttr} (${r.subVal})`,
      `${r.attrMod >= 0 ? "+" : ""}${r.attrMod}%`,
      r.bonus === 0 ? "—" : `${r.bonus >= 0 ? "+" : ""}${r.bonus}%`,
      `${r.total}%`,
    ]),
    theme: "striped",
    ...tableBase,
    columnStyles: {
      5: { halign: "right", fontStyle: "bold", textColor: GOLD },
      1: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
    },
    ...makeEditableHooks([1, 2, 3, 4, 5], {
      1: "center",
      3: "center",
      4: "center",
      5: "right",
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // ===== PONTOS DE VIDA =====
  const hpBreakdown = computeHitPointsBreakdown({
    subAttributes: input.subAttributes,
    constMain: input.attributes.Constituição,
    selectedClass: input.selectedClass,
  });
  const maxHp = hpBreakdown.total;
  const currentHp = resolveCurrentHp(loadout.currentHp, maxHp);
  beginSection("Pontos de Vida", estimateTableHeight(1) + 14);
  autoTable(doc, {
    startY: y,
    head: [["Base", "Condicionamento", "Máximo", "Atuais"]],
    body: [[
      String(hpBreakdown.base),
      `${formatSigned(hpBreakdown.condicionamentoBonus)} (Cond. ${hpBreakdown.condicionamentoValue})`,
      String(maxHp),
      String(currentHp),
    ]],
    theme: "grid",
    ...tableBase,
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "center" },
      2: { halign: "center", fontStyle: "bold", textColor: GOLD },
      3: { halign: "center", fontStyle: "bold", textColor: BLOOD },
    },
    ...makeEditableHooks([0, 1, 2, 3], {
      0: "center",
      1: "center",
      2: "center",
      3: "center",
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  setColor(MUTED);
  doc.text(
    `8 PV base + Ajst. PV (${hpBreakdown.ajstPVRaw})${
      hpBreakdown.usesFighterModifier ? " — classe marcial" : ""
    }`,
    margin,
    y,
  );
  y += 14;

  const resourceRows: string[][] = [];
  if (hasMagicAccess) {
    const maxMana = loadout.maxMana;
    resourceRows.push([
      "Pontos de Magia",
      String(maxMana),
      String(resolveResourceCurrent(loadout.currentMana, maxMana)),
    ]);
  }
  if (input.arcaneSpecialist) {
    const maxSpecialist = loadout.maxSpecialistMana;
    resourceRows.push([
      `Magia — ${input.arcaneSpecialist}`,
      String(maxSpecialist),
      String(resolveResourceCurrent(loadout.currentSpecialistMana, maxSpecialist)),
    ]);
  }
  if (loadout.showChi) {
    resourceRows.push([
      "Chi",
      String(loadout.maxChi),
      String(resolveResourceCurrent(loadout.currentChi, loadout.maxChi)),
    ]);
  }

  if (resourceRows.length > 0) {
    beginSection("Recursos", estimateTableHeight(resourceRows.length));
    autoTable(doc, {
      startY: y,
      head: [["Recurso", "Máximo", "Atuais"]],
      body: resourceRows,
      theme: "grid",
      ...tableBase,
      columnStyles: {
        1: { halign: "center", fontStyle: "bold", textColor: GOLD },
        2: { halign: "center", fontStyle: "bold", textColor: BLOOD },
      },
      ...makeEditableHooks([1, 2], { 1: "center", 2: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    const suggestedMana = computeSuggestedManaMax(hasMagicAccess, input.selectedRaceClassAdv);
    const suggestedSchool = computeSuggestedSpecialistManaMax(
      input.arcaneSpecialist,
      input.selectedRaceClassAdv
    );
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setColor(MUTED);
    const hints: string[] = [];
    if (hasMagicAccess) hints.push(`Magia sugerida (inicial): ${suggestedMana}`);
    if (input.arcaneSpecialist) hints.push(`Escola sugerida: ${suggestedSchool}`);
    if (loadout.showChi) hints.push("Chi inicia em 0; máximos editáveis conforme evolução.");
    doc.text(hints.join(" · "), margin, y);
    y += 14;
  }

  // ===== COMBATE (CA) =====
  const caBreakdown = computeArmorClassBreakdown({
    subAttributes: input.subAttributes,
    purchased: inventory,
    selectedRaceClassAdv: input.selectedRaceClassAdv,
    destrezaMain: input.attributes.Destreza,
    sabedoriaMain: input.attributes.Sabedoria,
    loadout,
  });
  const caHeaders = ["Base", "Destreza", "Armadura", "Elmo", "Escudo", "Outros", "Magia"];
  const caValues: (string | number)[] = [
    caBreakdown.base,
    formatSigned(caBreakdown.destreza),
    formatSigned(caBreakdown.armadura),
    formatSigned(caBreakdown.elmo),
    formatSigned(caBreakdown.escudo),
    formatSigned(caBreakdown.outros),
    formatSigned(caBreakdown.magia),
  ];
  if (caBreakdown.hasWisdomDefense) {
    caHeaders.push("Sabedoria");
    caValues.push(formatSigned(caBreakdown.sabedoria));
  }
  caHeaders.push("Total");
  caValues.push(caBreakdown.total);

  const equipParts: string[] = [];
  if (caBreakdown.equippedArmorName) {
    equipParts.push(`Armadura: ${caBreakdown.equippedArmorName}`);
  }
  if (caBreakdown.equippedShieldName) {
    equipParts.push(`Escudo: ${caBreakdown.equippedShieldName}`);
  }
  if (caBreakdown.outrosAuto.length > 0) {
    equipParts.push(
      caBreakdown.outrosAuto.map((e) => `${e.label} ${formatSigned(e.value)}`).join(", "),
    );
  }
  if (loadout.magicBonuses.length > 0) {
    equipParts.push(
      loadout.magicBonuses.map((b) => `${b.label} ${formatSigned(b.value)}`).join(", "),
    );
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  const equipNoteH =
    equipParts.length > 0
      ? (doc.splitTextToSize(equipParts.join(" · "), pageW - margin * 2) as string[]).length *
          8 +
        8
      : 0;
  beginSection("Combate — Categoria de Armadura", estimateTableHeight(1) + equipNoteH);

  autoTable(doc, {
    startY: y,
    head: [caHeaders],
    body: [caValues.map(String)],
    theme: "grid",
    ...tableBase,
    styles: { ...tableBase.styles, halign: "center" },
    columnStyles: {
      [caHeaders.length - 1]: { fontStyle: "bold", textColor: GOLD },
    },
    ...makeEditableHooks(
      caHeaders.map((_, i) => i),
      Object.fromEntries(caHeaders.map((_, i) => [i, "center" as const])),
    ),
  });
  y = (doc as any).lastAutoTable.finalY + 6;
  if (equipParts.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setColor(MUTED);
    doc.text(equipParts.join(" · "), margin, y, { maxWidth: pageW - margin * 2 });
    y += 12;
  }
  y += 4;

  const attackRows = loadout.weaponSlots.map((slot, index) => {
    const isMartialArtsRow = artesMarciaisAtivas && index === 0;
    const attack = computeAttackRollBreakdown({
      slot,
      subAttributes: input.subAttributes,
      forcaMain: input.attributes.Força,
      destrezaMain: input.attributes.Destreza,
      selectedRaceClassAdv: input.selectedRaceClassAdv,
      attackBaseBonus: loadout.attackBaseBonus,
      isMartialArts: isMartialArtsRow,
      customItems,
    });
    const base = slot.baseOverride ?? attack.base;
    const forca = slot.forcaOverride ?? attack.forca;
    const destreza = slot.destrezaOverride ?? attack.destreza;
    const pericia = slot.periciaOverride ?? attack.pericia;
    const total =
      base + forca + destreza + pericia + (slot.magiaAttack ?? attack.magia);
    return [
      getSlotDisplayName(slot, isMartialArtsRow, customItems),
      isMartialArtsRow ? "—" : slot.tipo || "—",
      isMartialArtsRow ? martialArtsDamage : slot.damageSm || "—",
      isMartialArtsRow ? martialArtsDamage : slot.damageLg || "—",
      formatSigned(attack.damageBonus),
      formatSigned(base),
      formatSigned(forca),
      formatSigned(destreza),
      formatSigned(pericia),
      formatSigned(slot.magiaAttack ?? attack.magia),
      formatSigned(total),
    ];
  });

  beginSection(
    "Combate — Jogada de Ataque",
    10 + estimateTableHeight(attackRows.length, { rowH: 14, headH: 20 }),
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(MUTED);
  doc.text(
    `Base de ataque global: ${formatSigned(loadout.attackBaseBonus)} · Nível ${input.characterLevel}`,
    margin,
    y,
  );
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [[
      "Arma",
      "Tipo",
      "Dano P/M",
      "Dano G",
      "Bônus",
      "Base",
      "Força",
      "Dest.",
      "Perícia",
      "Magia",
      "Total",
    ]],
    body: attackRows,
    theme: "striped",
    ...tableBase,
    styles: { ...tableBase.styles, fontSize: 7, cellPadding: 3 },
    headStyles: { ...tableBase.headStyles, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 72 },
      10: { halign: "right", fontStyle: "bold", textColor: GOLD },
    },
    ...makeEditableHooks([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {
      4: "center",
      5: "center",
      6: "center",
      7: "center",
      8: "center",
      9: "center",
      10: "right",
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // ===== PROFICIÊNCIAS EM ARMAS =====
  const hasWeaponProf =
    input.selectedWeaponGroups.length > 0 ||
    input.selectedWeapons.length > 0 ||
    input.selectedShields.length > 0;
  if (hasWeaponProf) {
    const profRows: string[][] = [];
    input.selectedWeaponGroups
      .slice()
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((g) => profRows.push(["Grupo", g]));
    input.selectedWeapons
      .slice()
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((key) => {
        const [, weapon] = key.split("::");
        profRows.push(["Arma", weapon ?? key]);
      });
    input.selectedShields
      .slice()
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((s) => profRows.push(["Escudo", s]));
    beginSection("Proficiências em Armas", estimateTableHeight(profRows.length));
    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Proficiência"]],
      body: profRows,
      theme: "striped",
      ...tableBase,
      columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
      ...makeEditableHooks([0, 1]),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== PERÍCIAS =====
  const sortedSkills = [...input.selectedSkills].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  if (sortedSkills.length > 0) {
    beginSection(
      `Perícias (${sortedSkills.length})`,
      estimateTableHeight(sortedSkills.length),
    );
    autoTable(doc, {
      startY: y,
      head: [["Perícia", "Custo"]],
      body: sortedSkills.map((s) => [s, String(getSkillCostForExport(s, input.selectedClass))]),
      theme: "striped",
      ...tableBase,
      columnStyles: { 1: { halign: "center", cellWidth: 60 } },
      ...makeEditableHooks([0, 1], { 1: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== MAGIA =====
  if (hasMagicAccess) {
    const accessRows: string[][] = [];
    Object.entries(input.divineAccess)
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .forEach(([sphere, level]) => {
        accessRows.push([
          "Divina",
          sphere,
          level === "major" ? "Maior" : "Menor",
        ]);
      });
    Object.entries(input.arcaneAccess)
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .forEach(([school]) => {
        const isSpecialist = input.arcaneSpecialist === school;
        accessRows.push([
          "Arcana",
          school,
          isSpecialist ? "Especialista" : "Acesso",
        ]);
      });
    if (input.arcaneSpecialist && !input.arcaneAccess[input.arcaneSpecialist]) {
      accessRows.push(["Arcana", input.arcaneSpecialist, "Especialista"]);
    }
    beginSection("Magia", estimateTableHeight(accessRows.length));
    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Esfera / Escola", "Nível"]],
      body: accessRows,
      theme: "striped",
      ...tableBase,
      columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" }, 2: { halign: "center", cellWidth: 70 } },
      ...makeEditableHooks([0, 1, 2], { 2: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== VANTAGENS / DESVANTAGENS =====
  const allAdv = [...generalAdvantages, ...generalDisadvantages, ...raceClassAdvantages];
  const advEntries = [
    ...input.selectedAdvantages.map((name) => {
      const item = allAdv.find((a) => a.name === name);
      return { name, cost: item?.cost ?? 0, isAdv: item?.type === "advantage" };
    }),
    ...input.selectedRaceClassAdv.map((name) => {
      const item = raceClassAdvantages.find((a) => a.name === name);
      const matchesRace = item?.applicableRaces?.includes(input.selectedRace);
      const matchesClass = item?.applicableClasses?.includes(input.selectedClass);
      const cost =
        matchesRace || matchesClass
          ? item?.cost ?? 0
          : item?.costOthers ?? item?.cost ?? 0;
      return { name, cost, isAdv: item?.type === "advantage" };
    }),
  ];
  const advs = advEntries.filter((e) => e.isAdv);
  const disadvs = advEntries.filter((e) => !e.isAdv);

  if (advs.length > 0) {
    beginSection(`Vantagens (${advs.length})`, estimateTableHeight(advs.length));
    autoTable(doc, {
      startY: y,
      head: [["Vantagem", "Custo"]],
      body: advs.map((a) => [a.name, String(a.cost)]),
      theme: "striped",
      ...tableBase,
      columnStyles: { 1: { halign: "center", cellWidth: 60 } },
      ...makeEditableHooks([0, 1], { 1: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  if (disadvs.length > 0) {
    beginSection(`Desvantagens (${disadvs.length})`, estimateTableHeight(disadvs.length));
    autoTable(doc, {
      startY: y,
      head: [["Desvantagem", "Pontos"]],
      body: disadvs.map((d) => [d.name, String(d.cost)]),
      theme: "striped",
      ...tableBase,
      headStyles: { fillColor: BLOOD, textColor: [245, 230, 210], fontStyle: "bold", fontSize: 8, cellPadding: 5 },
      columnStyles: { 1: { halign: "center", cellWidth: 60, textColor: BLOOD, fontStyle: "bold" } },
      ...makeEditableHooks([0, 1], { 1: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== INVENTÁRIO =====
  const startingPc = getStartingCapitalPc(input.selectedSocialClass, socialClasses);
  const spentPc = getSpentCopper(input.purchasedItems);
  const remainingPc = getRemainingCopper(
    input.selectedSocialClass,
    socialClasses,
    input.purchasedItems,
    extraMoneyPc,
  );
  const totalWeight = getTotalWeightKg(input.purchasedItems, addedItems, customItems);
  const resistenciaValue =
    input.subAttributes["Resistência"] ?? input.attributes.Força;
  const cargaBonus =
    getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);

  const catalogOwnedItems = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: equipmentById[id], qty }))
    .filter((e) => e.item)
    .sort((a, b) => a.item!.name.localeCompare(b.item!.name, "pt-BR"));
  const ownedItems = [
    ...catalogOwnedItems.map(({ item, qty }) => ({
      name: item!.name,
      qty,
      weightKg: item!.weightKg * qty,
    })),
    ...customItems
      .filter((item) => item.qty > 0)
      .map((item) => ({
        name: item.name,
        qty: item.qty,
        weightKg: item.weightKg * item.qty,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const equipmentContentH =
    estimateTableHeight(1) +
    8 +
    (ownedItems.length > 0 ? estimateTableHeight(ownedItems.length) : 0);
  beginSection("Inventário", equipmentContentH);

  autoTable(doc, {
    startY: y,
    head: [["Capital Inicial", "Gasto", "Restante", "Peso"]],
    body: [[
      formatMoney(startingPc),
      formatMoney(spentPc),
      formatMoney(remainingPc),
      `${totalWeight.toFixed(1).replace(".", ",")} kg${cargaKg > 0 ? ` / ${cargaKg.toFixed(1).replace(".", ",")} kg` : ""}`,
    ]],
    theme: "grid",
    ...tableBase,
    styles: { ...tableBase.styles, halign: "center" },
    columnStyles: { 2: { fontStyle: "bold", textColor: GOLD } },
    ...makeEditableHooks([0, 1, 2, 3], {
      0: "center",
      1: "center",
      2: "center",
      3: "center",
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (ownedItems.length > 0) {
    const itemsTableH = estimateTableHeight(ownedItems.length);
    if (itemsTableH <= maxBlockHeight()) {
      ensureSpace(itemsTableH);
    }
    autoTable(doc, {
      startY: y,
      head: [["Item", "Qtd.", "Peso (kg)"]],
      body: ownedItems.map(({ name, qty, weightKg }) => [
        name,
        String(qty),
        weightKg.toFixed(2).replace(".", ","),
      ]),
      theme: "striped",
      ...tableBase,
      columnStyles: {
        1: { halign: "center", cellWidth: 50 },
        2: { halign: "right", cellWidth: 70 },
      },
      ...makeEditableHooks([0, 1, 2], { 1: "center", 2: "right" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== HISTÓRICO =====
  const historyBoxH = 160;
  beginSection("Histórico", historyBoxH + 16);
  const historyBoxW = pageW - margin * 2;
  doc.setFillColor(255, 252, 246);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y + 10, historyBoxW, historyBoxH, 3, 3, "FD");
  doc.setDrawColor(220, 210, 195);
  doc.setLineWidth(0.25);
  for (let lineY = y + 26; lineY < y + 10 + historyBoxH - 6; lineY += 14) {
    doc.line(margin + 8, lineY, pageW - margin - 8, lineY);
  }
  addTextField({
    value: (input.characterHistory ?? "").trim(),
    x: margin + 6,
    y: y + 14,
    w: historyBoxW - 12,
    h: historyBoxH - 8,
    fontSize: 9,
    multiline: true,
  });
  y += 10 + historyBoxH + 14;

  // ===== ANOTAÇÕES =====
  const notesBoxH = 120;
  const notesGap = 12;
  const notesBlockH = notesBoxH * 2 + notesGap + 16;
  beginSection("Anotações", notesBlockH);

  const drawNotesBox = (label: string, value: string, boxY: number) => {
    const boxW = pageW - margin * 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(GOLD_DARK);
    doc.text(label.toUpperCase(), margin + 4, boxY - 2);

    doc.setFillColor(255, 252, 246);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, boxY, boxW, notesBoxH, 3, 3, "FD");
    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.25);
    for (let lineY = boxY + 16; lineY < boxY + notesBoxH - 6; lineY += 14) {
      doc.line(margin + 8, lineY, pageW - margin - 8, lineY);
    }
    addTextField({
      value: value.trim(),
      x: margin + 6,
      y: boxY + 4,
      w: boxW - 12,
      h: notesBoxH - 8,
      fontSize: 9,
      multiline: true,
    });
  };

  drawNotesBox("Itens", input.notesItems ?? "", y + 10);
  y += 10 + notesBoxH + notesGap;
  drawNotesBox("Geral", input.notesGeneral ?? "", y + 10);
  y += 10 + notesBoxH + 14;

  // ===== PONTOS =====
  beginSection("Total de Pontos", estimateTableHeight(2, { rowH: 20 }));
  autoTable(doc, {
    startY: y,
    body: [
      ["Pontos de Atributos", `${input.attributePointsSpent} / 75`],
      ["Pontos de Personagem", `${input.characterPointsSpent} / 100`],
    ],
    theme: "grid",
    ...tableBase,
    styles: { ...tableBase.styles, fontSize: 10, cellPadding: 6 },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold", textColor: GOLD },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        data.cell.styles.fillColor = data.row.index === 0 ? CREAM : STRIPE;
      }
    },
  });

  // ===== GRIMÓRIO / LIVRO DE ORAÇÕES (final do PDF) =====
  const grimoireStartPage =
    input.grimoire.length > 0
      ? renderGrimoireSection(doc, input.grimoire, pageW, pageH, margin)
      : null;

  // ===== FOOTER on each page =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageFooter(
      doc,
      pageW,
      pageH,
      i,
      pageCount,
      grimoireStartPage !== null && i >= grimoireStartPage,
    );
  }

  const safeName = (input.charName.trim() || "personagem")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`ficha-${safeName}.pdf`);
}

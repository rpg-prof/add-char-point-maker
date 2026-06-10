import jsPDF, { AcroFormTextField } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  generalAdvantages,
  generalDisadvantages,
  reputations,
  skills,
  socialClasses,
  type AttributeName,
} from "@/data/characterData";
import {
  equipmentById,
  formatMoney,
  getRemainingCopper,
  getSpentCopper,
  getStartingCapitalPc,
  getTotalWeightKg,
  type PurchasedItems,
} from "@/data/equipment";
import { parseCargaKg } from "@/data/currency";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import { getSubAttributeBonuses, subAttributeMap } from "@/data/subAttributes";
import { computeResistanceBreakdown } from "@/lib/resistanceStats";

export interface ExportCharacterPdfInput {
  charName: string;
  playerName: string;
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  selectedReputation: number;
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedSkills: string[];
  attributePointsSpent: number;
  characterPointsSpent: number;
}

function getSkillCost(skillName: string, characterClass: string): number {
  const skill = skills.find((s) => s.name === skillName);
  if (!skill) return 0;
  const classToGroups: Record<string, string[]> = {
    Guerreiro: ["Guerreiro"],
    Paladino: ["Guerreiro"],
    Ranger: ["Guerreiro"],
    Ladrão: ["Ladrão/Bardo"],
    Bardo: ["Ladrão/Bardo"],
    Sacerdote: ["Sacerdote"],
    Arcano: ["Mago"],
  };
  const all = [skill.group, ...(skill.additionalGroups || [])];
  const match = classToGroups[characterClass] || [];
  const isClass = skill.group === "Geral" || all.some((g) => match.includes(g));
  return isClass ? skill.cost : skill.cost * 2;
}

const GOLD: [number, number, number] = [176, 141, 76];
const DARK: [number, number, number] = [40, 32, 24];
const MUTED: [number, number, number] = [110, 100, 88];
const BLOOD: [number, number, number] = [155, 40, 40];

export function exportCharacterPdf(input: ExportCharacterPdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  let y = margin;

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
    f.fontSize = opts.fontSize ?? 9;
    f.multiline = !!opts.multiline;
    f.Rect = [opts.x, opts.y, opts.w, opts.h];
    // alignment: 0 left, 1 center, 2 right
    (f as any).textAlign = opts.align ?? "left";
    if (opts.color) {
      (f as any).color = opts.color;
    }
    doc.addField(f);
  };

  const setColor = (rgb: [number, number, number]) =>
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const sectionHeader = (label: string) => {
    if (y > pageH - 80) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(margin, y + 2, pageW - margin, y + 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(GOLD);
    doc.text(label.toUpperCase(), margin, y);
    y += 12;
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
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(180, 150, 90);
  doc.text("FICHA DE PERSONAGEM · AD&D 2.5", margin, 22);

  // Editable: character name (large) and player name
  addTextField({
    value: input.charName.trim() || "Personagem Sem Nome",
    x: margin,
    y: 30,
    w: pageW - margin * 2,
    h: 22,
    fontSize: 16,
    align: "left",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(210, 200, 180);
  doc.text("JOGADOR", margin, 64);
  addTextField({
    value: input.playerName,
    x: margin + 50,
    y: 54,
    w: pageW - margin * 2 - 50,
    h: 14,
    fontSize: 9,
  });
  y = 80;

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
  const factW = (pageW - margin * 2) / 4;
  facts.forEach((f, i) => {
    const fx = margin + i * factW;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(GOLD);
    doc.text(f.label.toUpperCase(), fx + 2, y);
    addTextField({
      value: f.value,
      x: fx + 1,
      y: y + 3,
      w: factW - 4,
      h: 14,
      fontSize: 9,
    });
  });
  y += 28;

  // ===== ATRIBUTOS =====
  sectionHeader("Atributos");
  const attrRows = subAttributeMap.map(({ main, sub1, sub2 }) => {
    const mv = input.attributes[main as AttributeName];
    const s1 = input.subAttributes[sub1] ?? mv;
    const s2 = input.subAttributes[sub2] ?? mv;
    return [main, String(mv), `${sub2}: ${s2}`, `${sub1}: ${s1}`];
  });
  autoTable(doc, {
    startY: y,
    head: [["Atributo", "Valor", "Sub", "Sub"]],
    body: attrRows,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: DARK, textColor: [225, 200, 130], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "center", cellWidth: 40, textColor: GOLD, fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
    ...makeEditableHooks([1, 2, 3], { 1: "center" }),
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // ===== RESISTÊNCIAS =====
  sectionHeader("Resistências");
  const resistances = computeResistanceBreakdown({
    subAttributes: input.subAttributes,
    selectedRaceClassAdv: input.selectedRaceClassAdv,
  });
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
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: DARK, textColor: [225, 200, 130], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      5: { halign: "right", fontStyle: "bold", textColor: GOLD },
      1: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
    },
    margin: { left: margin, right: margin },
    ...makeEditableHooks([1, 2, 3, 4, 5], {
      1: "center",
      3: "center",
      4: "center",
      5: "right",
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // ===== PERÍCIAS =====
  const sortedSkills = [...input.selectedSkills].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  if (sortedSkills.length > 0) {
    sectionHeader(`Perícias (${sortedSkills.length})`);
    autoTable(doc, {
      startY: y,
      head: [["Perícia", "Custo"]],
      body: sortedSkills.map((s) => [s, String(getSkillCost(s, input.selectedClass))]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: DARK, textColor: [225, 200, 130], fontStyle: "bold", fontSize: 8 },
      columnStyles: { 1: { halign: "center", cellWidth: 60 } },
      margin: { left: margin, right: margin },
      ...makeEditableHooks([0, 1], { 1: "center" }),
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
    sectionHeader(`Vantagens (${advs.length})`);
    autoTable(doc, {
      startY: y,
      head: [["Vantagem", "Custo"]],
      body: advs.map((a) => [a.name, String(a.cost)]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: DARK, textColor: [225, 200, 130], fontStyle: "bold", fontSize: 8 },
      columnStyles: { 1: { halign: "center", cellWidth: 60 } },
      margin: { left: margin, right: margin },
      ...makeEditableHooks([0, 1], { 1: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  if (disadvs.length > 0) {
    sectionHeader(`Desvantagens (${disadvs.length})`);
    autoTable(doc, {
      startY: y,
      head: [["Desvantagem", "Pontos"]],
      body: disadvs.map((d) => [d.name, String(d.cost)]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: BLOOD, textColor: [245, 230, 210], fontStyle: "bold", fontSize: 8 },
      columnStyles: { 1: { halign: "center", cellWidth: 60, textColor: BLOOD, fontStyle: "bold" } },
      margin: { left: margin, right: margin },
      ...makeEditableHooks([0, 1], { 1: "center" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== DINHEIRO & EQUIPAMENTO =====
  sectionHeader("Dinheiro & Equipamento");
  const startingPc = getStartingCapitalPc(input.selectedSocialClass, socialClasses);
  const spentPc = getSpentCopper(input.purchasedItems);
  const remainingPc = getRemainingCopper(
    input.selectedSocialClass,
    socialClasses,
    input.purchasedItems,
  );
  const totalWeight = getTotalWeightKg(input.purchasedItems);
  const resistenciaValue =
    input.subAttributes["Resistência"] ?? input.attributes.Força;
  const cargaBonus =
    getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);

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
    styles: { font: "helvetica", fontSize: 9, cellPadding: 4, halign: "center", textColor: DARK },
    headStyles: { fillColor: DARK, textColor: [225, 200, 130], fontStyle: "bold", fontSize: 8 },
    margin: { left: margin, right: margin },
    ...makeEditableHooks([0, 1, 2, 3], {
      0: "center",
      1: "center",
      2: "center",
      3: "center",
    }),
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  const ownedItems = Object.entries(input.purchasedItems)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: equipmentById[id], qty }))
    .filter((e) => e.item)
    .sort((a, b) => a.item!.name.localeCompare(b.item!.name, "pt-BR"));

  if (ownedItems.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Item", "Qtd.", "Peso (kg)"]],
      body: ownedItems.map(({ item, qty }) => [
        item!.name,
        String(qty),
        (item!.weightKg * qty).toFixed(2).replace(".", ","),
      ]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: DARK, textColor: [225, 200, 130], fontStyle: "bold", fontSize: 8 },
      columnStyles: {
        1: { halign: "center", cellWidth: 50 },
        2: { halign: "right", cellWidth: 70 },
      },
      margin: { left: margin, right: margin },
      ...makeEditableHooks([0, 1, 2], { 1: "center", 2: "right" }),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  // ===== ANOTAÇÕES =====
  sectionHeader("Anotações");
  if (y > pageH - 140) {
    doc.addPage();
    y = margin;
  }
  const notesH = Math.min(160, pageH - y - 120);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, pageW - margin * 2, notesH);
  addTextField({
    value: "",
    x: margin + 2,
    y: y + 2,
    w: pageW - margin * 2 - 4,
    h: notesH - 4,
    fontSize: 10,
    multiline: true,
  });
  y += notesH + 14;

  // ===== PONTOS =====
  sectionHeader("Total de Pontos");
  autoTable(doc, {
    startY: y,
    body: [
      ["Pontos de Atributos", `${input.attributePointsSpent} / 75`],
      ["Pontos de Personagem", `${input.characterPointsSpent} / 100`],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 5, textColor: DARK },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right", fontStyle: "bold", textColor: GOLD },
    },
    margin: { left: margin, right: margin },
  });

  // ===== FOOTER on each page =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      `Gerado pelo Criador de Personagens AD&D 2.5 · Página ${i}/${pageCount}`,
      pageW / 2,
      pageH - 14,
      { align: "center" },
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

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Shield, Swords, Scroll, BookOpen, User, Crosshair, Save, Upload, ChevronLeft, ChevronRight, Check, Sparkles, TrendingUp, Undo2, Heart, AlertTriangle, Award, FileText, NotebookPen, BookHeart, Backpack } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  
} from "@/components/ui/sidebar";
import { exportCharacterPdf } from "@/lib/exportCharacterPdf";
import AppLogo from "@/components/AppLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PointTracker from "@/components/PointTracker";
import AttributePanel from "@/components/AttributePanel";
import RaceClassPanel from "@/components/RaceClassPanel";
import AdvantagesPanel from "@/components/AdvantagesPanel";
import SkillsPanel from "@/components/SkillsPanel";
import WeaponProficiencyPanel from "@/components/WeaponProficiencyPanel";
import MagicPanel from "@/components/MagicPanel";
import MagicResourcePanel from "@/components/MagicResourcePanel";
import MagicAccessPanel, { type DivineAccessLevel, type ArcaneAccessLevel } from "@/components/MagicAccessPanel";
import ResistancePanel from "@/components/ResistancePanel";
import InventoryPanel from "@/components/InventoryPanel";
import CombatPanel from "@/components/CombatPanel";
import SummaryPanel from "@/components/SummaryPanel";
import NotesPanel from "@/components/NotesPanel";
import HistoryPanel from "@/components/HistoryPanel";
import { divineSpheres, arcaneSchools, divineSphereCost, arcaneSchoolCost } from "@/data/magicAccess";
import {
  attributeNames,
  clampAttributeValue,
  races,
  classes,
  socialClasses,
  reputations,
  alignments,
  generalAdvantages,
  generalDisadvantages,
  type AttributeName,
} from "@/data/characterData";
import { skills, getSkillCost } from "@/data/skills";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import { subAttributeMap } from "@/data/subAttributes";
import { migratePurchasedItems, type CustomInventoryItem, type PurchasedItems } from "@/data/equipment";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import {
  getAttributeBreakdown,
  getCharacterPointBreakdown,
  getProgressionBreakdown,
} from "@/lib/pointBreakdown";
import { getGrimoirePointCost, normalizeGrimoire, type GrimoireEntry } from "@/lib/grimoire";
import {
  defaultMagicComponents,
  normalizeMagicComponents,
  type MagicComponentEntry,
} from "@/lib/magicComponents";
import { clampAttributesForRace } from "@/lib/clampAttributesForRace";
import { mergeInventory, normalizeCustomItems } from "@/lib/inventory";
import {
  defaultCombatLoadout,
  sanitizeCombatLoadout,
  type CombatLoadout,
} from "@/lib/combatStats";

const ATTRIBUTE_POINTS = 75;
const CHARACTER_POINTS = 100;
/** Máximo de pontos recuperáveis via desvantagens (inclui classe social negativa). */
const MAX_DISADVANTAGE_POINTS = CHARACTER_POINTS;

const DEFAULT_PAGE_TITLE = "AD&D 2.5 Edition - Criação de Personagens";
const NAMED_PAGE_TITLE_SUFFIX = "AD&D 2.5 Edition - Criação de Personagem";

const BASE_STEPS = [
  { label: "Identificação", icon: User, desc: "Dados básicos do personagem" },
  { label: "Atributos", icon: Shield, desc: "Distribua 75 pontos" },
  { label: "Raça & Classe", icon: User, desc: "Raça, classe, social e reputação" },
  { label: "Armas", icon: Crosshair, desc: "Proficiências com armas e escudos" },
  { label: "Perícias", icon: BookOpen, desc: "Perícias comuns do personagem" },
  { label: "Resistência", icon: Heart, desc: "Valores de resistência calculados" },
  { label: "Inventário", icon: Backpack, desc: "Dinheiro, armas, armaduras e equipamento do personagem" },
];

const COMBAT_STEP = { label: "Combate", icon: Swords, desc: "PV, CA, Chi e ataques" };
const MAGIC_ACCESS_STEP = {
  label: "Acesso a Magias",
  icon: Sparkles,
  desc: "Escolas arcanas e esferas divinas",
  hasSubTabs: true as const,
};
const ADVANTAGES_STEP = {
  label: "Vantagens",
  icon: Award,
  desc: "Vantagens, desvantagens, poderes e antecedentes",
  hasSubTabs: true as const,
};
const MAGIC_STEP = { label: "Magia", icon: Sparkles, desc: "Pontos de magia, grimório e orações" };
const HISTORY_STEP = { label: "Histórico", icon: BookHeart, desc: "Passado e história do personagem" };
const NOTES_STEP = { label: "Anotações", icon: NotebookPen, desc: "Itens e anotações gerais" };
const SUMMARY_STEP = { label: "Resumo", icon: Scroll, desc: "Revisão final" };

type AdvantageSubTab =
  | "gerais"
  | "ofensivo"
  | "defensivo"
  | "magica"
  | "outros"
  | "aversao"
  | "poder"
  | "antecedente";

const ADVANTAGE_SUB_TABS: { id: AdvantageSubTab; label: string; desc: string }[] = [
  { id: "gerais", label: "Vantagens Gerais", desc: "Vantagens e desvantagens universais do personagem" },
  { id: "ofensivo", label: "Vantagens Ofensivas", desc: "Ajustes ofensivos por raça e classe" },
  { id: "defensivo", label: "Vantagens Defensivas", desc: "Ajustes defensivos por raça e classe" },
  { id: "magica", label: "Vantagens Mágicas", desc: "Vantagens e desvantagens mágicas" },
  { id: "outros", label: "Outras Vantagens", desc: "Outras vantagens e desvantagens por raça e classe" },
  { id: "aversao", label: "Aversões", desc: "Aversões raciais e restrições de tendência" },
  { id: "poder", label: "Poderes", desc: "Poderes especiais da classe" },
  { id: "antecedente", label: "Antecedentes", desc: "Antecedentes e elementos de história" },
];

type MagicAccessSubTab = "divine" | "arcane";

const MAGIC_ACCESS_SUB_TABS: { id: MagicAccessSubTab; label: string; desc: string }[] = [
  {
    id: "divine",
    label: "Esferas Divinas",
    desc: "Escolha as esferas de magia divina com acesso menor ou maior.",
  },
  {
    id: "arcane",
    label: "Escolas Arcanas",
    desc: "Escolha escolas arcanas. Apenas uma escola pode ser de Especialista.",
  },
];


const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Basic info
  const [charName, setCharName] = useState("");
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const trimmed = charName.trim();
    document.title = trimmed
      ? `${trimmed} - ${NAMED_PAGE_TITLE_SUFFIX}`
      : DEFAULT_PAGE_TITLE;
  }, [charName]);

  const [sexo, setSexo] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [cabelos, setCabelos] = useState("");
  const [olhos, setOlhos] = useState("");
  const [tendencia, setTendencia] = useState("Neutro");

  // Attributes (default 10)
  const [attributes, setAttributes] = useState<Record<AttributeName, number>>(
    () =>
      Object.fromEntries(attributeNames.map((a) => [a, 10])) as Record<
        AttributeName,
        number
      >
  );

  // Sub-attributes
  const [subAttributes, setSubAttributes] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    subAttributeMap.forEach((def) => {
      init[def.sub1] = 10;
      init[def.sub2] = 10;
    });
    return init;
  });

  // Character points
  const [selectedRace, setSelectedRace] = useState("Humano");
  const [selectedClass, setSelectedClass] = useState("Sem Classe");

  // Magic access
  const [divineAccess, setDivineAccess] = useState<Record<string, "minor" | "major">>({});
  const [arcaneAccess, setArcaneAccess] = useState<Record<string, "access">>({});
  const [arcaneSpecialist, setArcaneSpecialist] = useState<string | null>(null);

  const hasMagicAccess =
    Object.keys(divineAccess).length > 0 ||
    Object.keys(arcaneAccess).length > 0 ||
    arcaneSpecialist !== null;

  const STEPS = useMemo(() => {
    const steps = [...BASE_STEPS, MAGIC_ACCESS_STEP, ADVANTAGES_STEP, COMBAT_STEP];
    if (hasMagicAccess) steps.push(MAGIC_STEP);
    steps.push(HISTORY_STEP, NOTES_STEP, SUMMARY_STEP);
    return steps;
  }, [hasMagicAccess]);

  const [advantageSubTab, setAdvantageSubTab] = useState<AdvantageSubTab>("gerais");
  const [magicAccessSubTab, setMagicAccessSubTab] = useState<MagicAccessSubTab>("divine");

  const stepSubTabs = useMemo(() => {
    const step = STEPS[currentStep];
    if (!step || !("hasSubTabs" in step)) return null;
    if (step.label === "Vantagens") return ADVANTAGE_SUB_TABS;
    if (step.label === "Acesso a Magias") return MAGIC_ACCESS_SUB_TABS;
    return null;
  }, [STEPS, currentStep]);

  const activeStepSubTab = useMemo(() => {
    if (!stepSubTabs) return null;
    const step = STEPS[currentStep];
    const id = step.label === "Vantagens" ? advantageSubTab : magicAccessSubTab;
    return stepSubTabs.find((t) => t.id === id) ?? null;
  }, [stepSubTabs, STEPS, currentStep, advantageSubTab, magicAccessSubTab]);

  const handleStepSubTabClick = (id: string) => {
    const step = STEPS[currentStep];
    if (step?.label === "Vantagens") setAdvantageSubTab(id as AdvantageSubTab);
    else if (step?.label === "Acesso a Magias") setMagicAccessSubTab(id as MagicAccessSubTab);
  };

  const [selectedSocialClass, setSelectedSocialClass] = useState("Classe média baixa");
  const [selectedReputation, setSelectedReputation] = useState(0);
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [selectedRaceClassAdv, setSelectedRaceClassAdv] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedWeaponGroups, setSelectedWeaponGroups] = useState<string[]>([]);
  const [selectedShields, setSelectedShields] = useState<string[]>([]);
  const [grimoire, setGrimoire] = useState<GrimoireEntry[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItems>({});
  const [addedItems, setAddedItems] = useState<PurchasedItems>({});
  const [customItems, setCustomItems] = useState<CustomInventoryItem[]>([]);
  const [extraMoneyPc, setExtraMoneyPc] = useState(0);
  const [combatLoadout, setCombatLoadout] = useState<CombatLoadout>(defaultCombatLoadout);
  const [notesItems, setNotesItems] = useState("");
  const [notesGeneral, setNotesGeneral] = useState("");
  const [magicComponents, setMagicComponents] = useState<MagicComponentEntry[]>(
    defaultMagicComponents,
  );
  const [characterHistory, setCharacterHistory] = useState("");

  const mergedInventory = useMemo(
    () => mergeInventory(purchasedItems, addedItems),
    [purchasedItems, addedItems],
  );

  useEffect(() => {
    setCombatLoadout((prev) => sanitizeCombatLoadout(prev, mergedInventory, customItems));
  }, [mergedInventory, customItems]);

  // Progression system
  interface ProgressionEntry {
    level: number;
    points: number;
    timestamp: string;
  }
  const [progressionHistory, setProgressionHistory] = useState<ProgressionEntry[]>([]);
  const [showEvolveDialog, setShowEvolveDialog] = useState(false);
  const [evolveLevel, setEvolveLevel] = useState(2);

  const totalProgressionPoints = useMemo(
    () => progressionHistory.reduce((sum, e) => sum + e.points, 0),
    [progressionHistory]
  );

  const characterLevel = useMemo(() => {
    if (progressionHistory.length === 0) return 1;
    return Math.max(...progressionHistory.map((e) => e.level));
  }, [progressionHistory]);

  const handleEvolve = useCallback(() => {
    const points = evolveLevel * 10;
    setProgressionHistory((prev) => [
      ...prev,
      { level: evolveLevel, points, timestamp: new Date().toISOString() },
    ]);
    setShowEvolveDialog(false);
    setEvolveLevel((prev) => prev + 1);
  }, [evolveLevel]);

  const handleUndoEvolve = useCallback(() => {
    setProgressionHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = prev.slice(0, -1);
      return newHistory;
    });
    setEvolveLevel((prev) => Math.max(2, prev - 1));
  }, []);

  // Calculate attribute points spent
  const attributePointsSpent = useMemo(
    () => Object.values(attributes).reduce((sum, val) => sum + val, 0),
    [attributes]
  );

  // Calculate character points spent
  const characterPointsSpent = useMemo(() => {
    const raceCost = races.find((r) => r.name === selectedRace)?.cost ?? 0;
    const classCost = classes.find((c) => c.name === selectedClass)?.cost ?? 0;
    const socialCost = socialClasses.find((s) => s.name === selectedSocialClass)?.cost ?? 0;
    const reputationCost = reputations.find((r) => r.level === selectedReputation)?.cost ?? 0;

    const allItems = [...generalAdvantages, ...generalDisadvantages];
    const advCost = selectedAdvantages.reduce((sum, name) => {
      const item = allItems.find((a) => a.name === name);
      return sum + (item?.cost ?? 0);
    }, 0);

    const raceClassAdvCost = selectedRaceClassAdv.reduce((sum, name) => {
      const item = raceClassAdvantages.find((a) => a.name === name);
      if (!item) return sum;
      const matchesRace = item.applicableRaces?.includes(selectedRace);
      const matchesClass = item.applicableClasses?.includes(selectedClass);
      const cost = (matchesRace || matchesClass) ? item.cost : (item.costOthers ?? item.cost);
      return sum + cost;
    }, 0);

    const skillCost = selectedSkills.reduce((sum, name) => {
      const skill = skills.find((s) => s.name === name);
      return sum + (skill ? getSkillCost(skill, selectedClass) : 0);
    }, 0);

    const weaponCost = selectedWeapons.reduce((sum, weaponKey) => {
      const [groupName] = weaponKey.split("::");
      if (selectedWeaponGroups.includes(groupName)) return sum;
      const group = weaponGroups.find((g) => g.name === groupName);
      return sum + (group?.costPerWeapon ?? 0);
    }, 0);

    const groupCost = selectedWeaponGroups.reduce((sum, groupName) => {
      const group = weaponGroups.find((g) => g.name === groupName);
      return sum + (group?.costGroup ?? 0);
    }, 0);

    const shieldCost = selectedShields.reduce((sum, name) => {
      const shield = shieldProficiencies.find((s) => s.name === name);
      return sum + (shield?.cost ?? 0);
    }, 0);

    // Magic access cost
    const divineCost = Object.entries(divineAccess).reduce((sum, [name, level]) => {
      const sphere = divineSpheres.find((s) => s.name === name);
      return sphere ? sum + divineSphereCost(sphere, level, selectedClass) : sum;
    }, 0);
    const arcaneCost = Object.keys(arcaneAccess).reduce((sum, name) => {
      const school = arcaneSchools.find((s) => s.name === name);
      return school ? sum + arcaneSchoolCost(school, selectedClass, selectedRace) : sum;
    }, 0);
    const specialistCost = arcaneSpecialist
      ? (() => {
          const sch = arcaneSchools.find((s) => s.name === arcaneSpecialist);
          if (!sch) return 0;
          return arcaneSchoolCost(sch, selectedClass, selectedRace) + (sch.specialization?.cost ?? 0);
        })()
      : 0;
    const magicCost = divineCost + arcaneCost + specialistCost;
    const grimoireCost = getGrimoirePointCost(grimoire);

    return raceCost + classCost + socialCost + reputationCost + advCost + raceClassAdvCost + skillCost + weaponCost + groupCost + shieldCost + magicCost + grimoireCost;
  }, [selectedRace, selectedClass, selectedSocialClass, selectedReputation, selectedAdvantages, selectedRaceClassAdv, selectedSkills, selectedWeapons, selectedWeaponGroups, selectedShields, divineAccess, arcaneAccess, arcaneSpecialist, grimoire]);

  const attributeBreakdown = useMemo(
    () => getAttributeBreakdown(attributes),
    [attributes]
  );

  const characterPointContext = useMemo(
    () => ({
      selectedRace,
      selectedClass,
      selectedSocialClass,
      selectedReputation,
      selectedAdvantages,
      selectedRaceClassAdv,
      selectedSkills,
      selectedWeapons,
      selectedWeaponGroups,
      selectedShields,
      grimoire,
      divineAccess,
      arcaneAccess,
      arcaneSpecialist,
    }),
    [
      selectedRace,
      selectedClass,
      selectedSocialClass,
      selectedReputation,
      selectedAdvantages,
      selectedRaceClassAdv,
      selectedSkills,
      selectedWeapons,
      selectedWeaponGroups,
      selectedShields,
      grimoire,
      divineAccess,
      arcaneAccess,
      arcaneSpecialist,
    ]
  );

  const characterBreakdown = useMemo(
    () => getCharacterPointBreakdown(characterPointContext),
    [characterPointContext]
  );

  const progressionBreakdown = useMemo(
    () =>
      getProgressionBreakdown(
        characterBreakdown,
        characterPointsSpent,
        progressionHistory
      ),
    [characterBreakdown, characterPointsSpent, progressionHistory]
  );

  const progressionPointsSpent = Math.max(0, characterPointsSpent - CHARACTER_POINTS);

  // Calculate total points gained from disadvantages (for display/limiting)
  const disadvantagePoints = useMemo(() => {
    const socialCost = socialClasses.find((s) => s.name === selectedSocialClass)?.cost ?? 0;
    const socialDisadvCost = socialCost < 0 ? Math.abs(socialCost) : 0;

    const allItems = [...generalAdvantages, ...generalDisadvantages];
    const generalDisadvCost = selectedAdvantages.reduce((sum, name) => {
      const item = allItems.find((a) => a.name === name);
      if (item?.type === "disadvantage") return sum + Math.abs(item.cost);
      return sum;
    }, 0);

    const raceClassDisadvCost = selectedRaceClassAdv.reduce((sum, name) => {
      const item = raceClassAdvantages.find((a) => a.name === name);
      if (!item || item.type !== "disadvantage") return sum;
      const matchesRace = item.applicableRaces?.includes(selectedRace);
      const matchesClass = item.applicableClasses?.includes(selectedClass);
      const cost = (matchesRace || matchesClass) ? item.cost : (item.costOthers ?? item.cost);
      return sum + Math.abs(cost);
    }, 0);

    return socialDisadvCost + generalDisadvCost + raceClassDisadvCost;
  }, [selectedAdvantages, selectedRaceClassAdv, selectedRace, selectedClass, selectedSocialClass]);

  const handleAttributeChange = (attr: AttributeName, value: number) => {
    const newVal = clampAttributeValue(selectedRace, attr, value);
    setAttributes((prev) => ({ ...prev, [attr]: newVal }));
  };

  const handleRaceChange = useCallback(
    (race: string) => {
      setSelectedRace(race);
      const clamped = clampAttributesForRace(attributes, subAttributes, race);
      setAttributes(clamped.attributes);
      setSubAttributes(clamped.subAttributes);
    },
    [attributes, subAttributes]
  );

  const handleSubAttributeChange = (subAttr: string, value: number) => {
    setSubAttributes((prev) => ({ ...prev, [subAttr]: value }));
  };

  const handleAdvantageToggle = (name: string) => {
    const allItems = [...generalAdvantages, ...generalDisadvantages];
    const item = allItems.find((a) => a.name === name);
    setSelectedAdvantages((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (
        item?.type === "disadvantage" &&
        disadvantagePoints + Math.abs(item.cost) > MAX_DISADVANTAGE_POINTS
      ) {
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleRaceClassAdvToggle = (name: string, cost: number) => {
    const item = raceClassAdvantages.find((a) => a.name === name);
    setSelectedRaceClassAdv((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (
        item?.type === "disadvantage" &&
        disadvantagePoints + Math.abs(cost) > MAX_DISADVANTAGE_POINTS
      ) {
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleSocialClassChange = (socialClass: string) => {
    const currentCost = socialClasses.find((s) => s.name === selectedSocialClass)?.cost ?? 0;
    const newCost = socialClasses.find((s) => s.name === socialClass)?.cost ?? 0;
    const currentDisadv = currentCost < 0 ? Math.abs(currentCost) : 0;
    const newDisadv = newCost < 0 ? Math.abs(newCost) : 0;
    const nextTotal = disadvantagePoints - currentDisadv + newDisadv;
    if (nextTotal > MAX_DISADVANTAGE_POINTS) return;
    setSelectedSocialClass(socialClass);
  };

  const canSelectSocialClass = useCallback(
    (socialClass: string) => {
      const currentCost = socialClasses.find((s) => s.name === selectedSocialClass)?.cost ?? 0;
      const newCost = socialClasses.find((s) => s.name === socialClass)?.cost ?? 0;
      const currentDisadv = currentCost < 0 ? Math.abs(currentCost) : 0;
      const newDisadv = newCost < 0 ? Math.abs(newCost) : 0;
      return disadvantagePoints - currentDisadv + newDisadv <= MAX_DISADVANTAGE_POINTS;
    },
    [disadvantagePoints, selectedSocialClass]
  );

  const handleAddResistance = (name: string, cost: number) => {
    const item = raceClassAdvantages.find((a) => a.name === name);
    setSelectedRaceClassAdv((prev) => {
      if (
        item?.type === "disadvantage" &&
        disadvantagePoints + Math.abs(cost) > MAX_DISADVANTAGE_POINTS
      ) {
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleRemoveResistance = (name: string) => {
    setSelectedRaceClassAdv((prev) => {
      const idx = prev.lastIndexOf(name);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSkillToggle = (name: string) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleWeaponToggle = (weaponKey: string) => {
    setSelectedWeapons((prev) =>
      prev.includes(weaponKey) ? prev.filter((n) => n !== weaponKey) : [...prev, weaponKey]
    );
  };

  const handleWeaponGroupToggle = (groupName: string) => {
    setSelectedWeaponGroups((prev) =>
      prev.includes(groupName) ? prev.filter((n) => n !== groupName) : [...prev, groupName]
    );
  };

  const handleShieldToggle = (shieldName: string) => {
    setSelectedShields((prev) =>
      prev.includes(shieldName) ? prev.filter((n) => n !== shieldName) : [...prev, shieldName]
    );
  };

  const handleGrimoireChange = (entries: GrimoireEntry[]) => {
    setGrimoire(entries);
  };

  const handleDivineAccessChange = (sphere: string, level: DivineAccessLevel) => {
    setDivineAccess((prev) => {
      const next = { ...prev };
      if (level === "none") delete next[sphere];
      else next[sphere] = level;
      return next;
    });
  };

  const handleArcaneAccessChange = (school: string, level: ArcaneAccessLevel) => {
    if (level === "specialist") {
      setArcaneSpecialist(school);
      setArcaneAccess((prev) => {
        const next = { ...prev };
        delete next[school];
        return next;
      });
    } else if (level === "access") {
      if (arcaneSpecialist === school) setArcaneSpecialist(null);
      setArcaneAccess((prev) => ({ ...prev, [school]: "access" }));
    } else {
      if (arcaneSpecialist === school) setArcaneSpecialist(null);
      setArcaneAccess((prev) => {
        const next = { ...prev };
        delete next[school];
        return next;
      });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    const data = {
      charName, playerName, sexo, idade, peso, altura, cabelos, olhos, tendencia,
      attributes, subAttributes,
      selectedRace, selectedClass, selectedSocialClass, selectedReputation,
      selectedAdvantages, selectedRaceClassAdv, selectedSkills,
      selectedWeapons, selectedWeaponGroups, selectedShields, grimoire,
      divineAccess, arcaneAccess, arcaneSpecialist,
      progressionHistory,
      purchasedItems,
      addedItems,
      customItems,
      extraMoneyPc,
      combatLoadout,
      notesItems,
      notesGeneral,
      magicComponents,
      characterHistory,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${charName || "personagem"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [charName, playerName, sexo, idade, peso, altura, cabelos, olhos, tendencia, attributes, subAttributes, selectedRace, selectedClass, selectedSocialClass, selectedReputation, selectedAdvantages, selectedRaceClassAdv, selectedSkills, selectedWeapons, selectedWeaponGroups, selectedShields, grimoire, divineAccess, arcaneAccess, arcaneSpecialist, progressionHistory, purchasedItems, addedItems, customItems, extraMoneyPc, combatLoadout, notesItems, notesGeneral, magicComponents, characterHistory]);

  const handleLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.charName !== undefined) setCharName(data.charName);
        if (data.playerName !== undefined) setPlayerName(data.playerName);
        if (data.sexo !== undefined) setSexo(data.sexo);
        if (data.idade !== undefined) setIdade(data.idade);
        if (data.peso !== undefined) setPeso(data.peso);
        if (data.altura !== undefined) setAltura(data.altura);
        if (data.cabelos !== undefined) setCabelos(data.cabelos);
        if (data.olhos !== undefined) setOlhos(data.olhos);
        if (data.tendencia !== undefined) setTendencia(data.tendencia);
        const loadedRace = data.selectedRace ?? "Humano";
        const loadedAttrs = data.attributes;
        const loadedSubs = data.subAttributes ?? {};
        if (loadedAttrs) {
          const clamped = clampAttributesForRace(loadedAttrs, loadedSubs, loadedRace);
          setAttributes(clamped.attributes);
          setSubAttributes(clamped.subAttributes);
        } else if (data.subAttributes) {
          setSubAttributes(data.subAttributes);
        }
        if (data.selectedRace) setSelectedRace(loadedRace);
        if (data.selectedClass) setSelectedClass(data.selectedClass);
        if (data.selectedSocialClass) setSelectedSocialClass(data.selectedSocialClass);
        if (typeof data.selectedReputation === "number") setSelectedReputation(data.selectedReputation);
        if (data.selectedAdvantages) setSelectedAdvantages(data.selectedAdvantages);
        if (data.selectedRaceClassAdv) {
          setSelectedRaceClassAdv(
            data.selectedRaceClassAdv.filter((n: string) => n !== "Magia Anotada")
          );
        }
        if (data.selectedSkills) setSelectedSkills(data.selectedSkills);
        if (data.selectedWeapons) setSelectedWeapons(data.selectedWeapons);
        if (data.selectedWeaponGroups) setSelectedWeaponGroups(data.selectedWeaponGroups);
        if (data.selectedShields) setSelectedShields(data.selectedShields);
        if (data.grimoire) setGrimoire(normalizeGrimoire(data.grimoire));
        if (data.divineAccess) setDivineAccess(data.divineAccess);
        else setDivineAccess({});
        if (data.arcaneAccess) setArcaneAccess(data.arcaneAccess);
        else setArcaneAccess({});
        setArcaneSpecialist(data.arcaneSpecialist ?? null);
        if (data.progressionHistory) {
          setProgressionHistory(data.progressionHistory);
          const maxLevel = data.progressionHistory.reduce((max: number, e: ProgressionEntry) => Math.max(max, e.level), 1);
          setEvolveLevel(maxLevel + 1);
        }
        const migratedPurchased = data.purchasedItems
          ? migratePurchasedItems(data.purchasedItems)
          : {};
        setPurchasedItems(migratedPurchased);
        setAddedItems(
          data.addedItems ? migratePurchasedItems(data.addedItems) : {},
        );
        setCustomItems(normalizeCustomItems(data.customItems));
        setExtraMoneyPc(
          typeof data.extraMoneyPc === "number" ? data.extraMoneyPc : 0,
        );
        const mergedOnLoad = mergeInventory(
          migratedPurchased,
          data.addedItems ? migratePurchasedItems(data.addedItems) : {},
        );
        if (data.combatLoadout) {
          setCombatLoadout(
            sanitizeCombatLoadout(
              { ...defaultCombatLoadout(), ...data.combatLoadout },
              mergedOnLoad,
              normalizeCustomItems(data.customItems),
            ),
          );
        } else {
          setCombatLoadout(defaultCombatLoadout());
        }
        if (data.notesItems !== undefined) setNotesItems(data.notesItems);
        else setNotesItems("");
        if (data.notesGeneral !== undefined) setNotesGeneral(data.notesGeneral);
        if (data.magicComponents !== undefined) {
          setMagicComponents(normalizeMagicComponents(data.magicComponents));
        } else if (data.magicComponentsNotes !== undefined) {
          setMagicComponents(normalizeMagicComponents(data.magicComponentsNotes));
        }
        else setNotesGeneral("");
        if (data.characterHistory !== undefined) setCharacterHistory(data.characterHistory);
        else setCharacterHistory("");
        setCurrentStep(0);
      } catch {
        alert("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const goNext = () => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goPrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    if (!step) return null;

    switch (step.label) {
      case "Identificação": {
        const inputCls = "w-full bg-background/50 border border-border rounded px-3 py-1.5 text-sm text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold";
        const labelCls = "font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block";
        return (
          <div className="space-y-6">
            <p className="font-body text-muted-foreground text-xs">
              Comece preenchendo os dados básicos do personagem.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nome do Personagem</label>
                <input type="text" value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Ex: Thorin Escudo-de-Carvalho" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nome do Jogador</label>
                <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Seu nome" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sexo</label>
                <input type="text" value={sexo} onChange={(e) => setSexo(e.target.value)} placeholder="Masculino / Feminino / ..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Idade</label>
                <input type="text" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="Ex: 27" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Peso</label>
                <input type="text" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ex: 80 kg" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Altura</label>
                <input type="text" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="Ex: 1,75m" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cabelos</label>
                <input type="text" value={cabelos} onChange={(e) => setCabelos(e.target.value)} placeholder="Ex: Castanhos longos" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Olhos</label>
                <input type="text" value={olhos} onChange={(e) => setOlhos(e.target.value)} placeholder="Ex: Verdes" className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Tendência</label>
                <select value={tendencia} onChange={(e) => setTendencia(e.target.value)} className={inputCls}>
                  {alignments.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      }
      case "Atributos":
        return (
          <div className="space-y-4">
            <p className="font-body text-muted-foreground text-xs">
              Distribua {ATTRIBUTE_POINTS} pontos entre os atributos. Cada um começa em 10.{" "}
              <a
                href="http://adeide25.net.uztec.com.br/pagina/01-atributos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Ver mais detalhes
              </a>
            </p>
            <AttributePanel
              attributes={attributes}
              subAttributes={subAttributes}
              selectedRace={selectedRace}
              onChange={handleAttributeChange}
              onSubChange={handleSubAttributeChange}
            />
          </div>
        );
      case "Raça & Classe":
        return (
          <div className="space-y-4">
            <p className="font-body text-muted-foreground text-xs">
              Escolha raça, classe, classe social e reputação. Cada opção consome pontos de personagem.
            </p>
            <RaceClassPanel
              selectedRace={selectedRace}
              selectedClass={selectedClass}
              selectedSocialClass={selectedSocialClass}
              selectedReputation={selectedReputation}
              onRaceChange={handleRaceChange}
              onClassChange={setSelectedClass}
              onSocialClassChange={handleSocialClassChange}
              canSelectSocialClass={canSelectSocialClass}
              onReputationChange={setSelectedReputation}
            />
          </div>
        );
      case "Resistência":
        return (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-xs">
              Resistências calculadas a partir do valor base + modificador da sub-habilidade + vantagens/desvantagens.
            </p>
            <ResistancePanel
              subAttributes={subAttributes}
              selectedRace={selectedRace}
              selectedClass={selectedClass}
              selectedRaceClassAdv={selectedRaceClassAdv}
              onAddResistance={handleAddResistance}
              onRemoveResistance={handleRemoveResistance}
            />
          </div>
        );
      case "Inventário":
        return (
          <div className="max-h-[62vh] overflow-y-auto pr-2">
            <InventoryPanel
              selectedSocialClass={selectedSocialClass}
              subAttributes={subAttributes}
              purchased={purchasedItems}
              added={addedItems}
              customItems={customItems}
              extraMoneyPc={extraMoneyPc}
              onPurchaseChange={setPurchasedItems}
              onAddedChange={setAddedItems}
              onCustomItemsChange={setCustomItems}
              onExtraMoneyChange={setExtraMoneyPc}
            />
          </div>
        );
      case "Combate":
        return (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <CombatPanel
              subAttributes={subAttributes}
              attributes={attributes}
              purchased={mergedInventory}
              customItems={customItems}
              selectedRaceClassAdv={selectedRaceClassAdv}
              selectedClass={selectedClass}
              characterLevel={characterLevel}
              loadout={combatLoadout}
              onLoadoutChange={setCombatLoadout}
            />
          </div>
        );
      case "Vantagens": {
        const subTab = ADVANTAGE_SUB_TABS.find((t) => t.id === advantageSubTab)!;
        const panelProps = {
          selected: selectedAdvantages,
          onToggle: handleAdvantageToggle,
          selectedRaceClassAdvantages: selectedRaceClassAdv,
          onRaceClassToggle: handleRaceClassAdvToggle,
          selectedRace,
          selectedClass,
          disadvantagePoints,
          maxDisadvantagePoints: MAX_DISADVANTAGE_POINTS,
        };

        if (advantageSubTab === "gerais") {
          return (
            <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
              <p className="font-body text-muted-foreground text-xs">{subTab.desc}</p>
              <AdvantagesPanel {...panelProps} showRaceClass={false} />
            </div>
          );
        }

        return (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-xs">{subTab.desc}</p>
            <AdvantagesPanel
              {...panelProps}
              showGeneral={false}
              categoriesFilter={[advantageSubTab]}
              raceClassHeading={subTab.label}
            />
          </div>
        );
      }
      case "Perícias":
        return (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-xs">
              Selecione as perícias que o personagem domina.
            </p>
            <SkillsPanel
              selected={selectedSkills}
              onToggle={handleSkillToggle}
              characterClass={selectedClass}
            />
          </div>
        );
      case "Armas":
        return (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-xs">
              Escolha proficiências com armas individuais, grupos inteiros e escudos.
            </p>
            <WeaponProficiencyPanel
              selectedWeapons={selectedWeapons}
              selectedGroups={selectedWeaponGroups}
              selectedShields={selectedShields}
              onWeaponToggle={handleWeaponToggle}
              onGroupToggle={handleWeaponGroupToggle}
              onShieldToggle={handleShieldToggle}
            />
          </div>
        );
      case "Acesso a Magias": {
        const subTab = MAGIC_ACCESS_SUB_TABS.find((t) => t.id === magicAccessSubTab)!;
        return (
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-xs">{subTab.desc}</p>
            <MagicAccessPanel
              section={magicAccessSubTab}
              selectedClass={selectedClass}
              selectedRace={selectedRace}
              divineAccess={divineAccess}
              arcaneAccess={arcaneAccess}
              arcaneSpecialist={arcaneSpecialist}
              onDivineChange={handleDivineAccessChange}
              onArcaneChange={handleArcaneAccessChange}
            />
          </div>
        );
      }
      case "Magia":
        return (
          <div className="max-h-[62vh] overflow-y-auto pr-2">
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <MagicPanel
                  grimoire={grimoire}
                  onGrimoireChange={handleGrimoireChange}
                  divineAccess={divineAccess}
                  arcaneAccess={arcaneAccess}
                  arcaneSpecialist={arcaneSpecialist}
                />
              </div>
              {(hasMagicAccess || arcaneSpecialist) && (
                <div className="w-1/4 shrink-0">
                  <MagicResourcePanel
                    loadout={combatLoadout}
                    onLoadoutChange={setCombatLoadout}
                    hasMagicAccess={hasMagicAccess}
                    arcaneSpecialist={arcaneSpecialist}
                    selectedRaceClassAdv={selectedRaceClassAdv}
                    magicComponents={magicComponents}
                    onMagicComponentsChange={setMagicComponents}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case "Histórico":
        return (
          <div className="max-h-[62vh] overflow-y-auto pr-2">
            <HistoryPanel
              characterHistory={characterHistory}
              onCharacterHistoryChange={setCharacterHistory}
            />
          </div>
        );
      case "Anotações":
        return (
          <div className="max-h-[62vh] overflow-y-auto pr-2">
            <NotesPanel
              notesItems={notesItems}
              notesGeneral={notesGeneral}
              onNotesItemsChange={setNotesItems}
              onNotesGeneralChange={setNotesGeneral}
            />
          </div>
        );
      case "Resumo":
        return (
          <SummaryPanel
            charName={charName}
            playerName={playerName}
            selectedRace={selectedRace}
            selectedClass={selectedClass}
            selectedSocialClass={selectedSocialClass}
            selectedReputation={selectedReputation}
            characterLevel={characterLevel}
            attributes={attributes}
            subAttributes={subAttributes}
            purchasedItems={purchasedItems}
            addedItems={addedItems}
            customItems={customItems}
            extraMoneyPc={extraMoneyPc}
            selectedAdvantages={selectedAdvantages}
            selectedRaceClassAdv={selectedRaceClassAdv}
            selectedSkills={selectedSkills}
            sexo={sexo}
            idade={idade}
            peso={peso}
            altura={altura}
            cabelos={cabelos}
            olhos={olhos}
            tendencia={tendencia}
            combatLoadout={combatLoadout}
            selectedWeapons={selectedWeapons}
            selectedWeaponGroups={selectedWeaponGroups}
            selectedShields={selectedShields}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full parchment-bg">
        {/* Sidebar with wizard steps */}
        <Sidebar collapsible="icon" className="border-r border-gold/30">
          <SidebarHeader className="dark-panel border-b border-gold/30">
            <div className="flex items-center gap-2.5 px-2 py-2 min-w-0">
              <AppLogo size={36} className="shrink-0" />
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <h1 className="font-display text-sm leading-tight text-gold tracking-wide truncate">
                  AD&amp;D 2.5
                </h1>
                <p className="font-body text-[10px] text-parchment/60 leading-tight">
                  Criação de Personagens
                </p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="dark-panel">
            <SidebarGroup>
              <SidebarGroupLabel className="font-display text-[10px] uppercase tracking-[0.18em] text-gold/70">
                Passos
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const isActive = i === currentStep;
                    const isDone = i < currentStep;
                    return (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuButton
                          onClick={() => setCurrentStep(i)}
                          isActive={isActive}
                          tooltip={step.label}
                          className={`font-body group/step ${
                            isActive
                              ? "bg-gold/15 text-gold border-l-2 border-gold"
                              : isDone
                              ? "text-gold/70 hover:text-gold hover:bg-gold/10"
                              : "text-parchment/55 hover:text-parchment hover:bg-parchment/5"
                          }`}
                        >
                          <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0 ${
                            isActive
                              ? "bg-gold text-parchment-dark"
                              : isDone
                              ? "bg-gold/30 text-gold"
                              : "bg-parchment/10 text-parchment/50"
                          }`}>
                            {isDone ? <Check className="w-3 h-3" /> : i + 1}
                          </span>
                          <StepIcon className="w-4 h-4 shrink-0 opacity-80" />
                          <span className="truncate text-xs tracking-wide">{step.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="dark-panel border-t border-gold/20">
            <p className="text-[10px] font-body text-parchment/50 px-2 py-1 group-data-[collapsible=icon]:hidden">
              <a
                href="http://adeide25.net.uztec.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors"
              >
                Sistema AD&amp;D 2.5 — v0.8
              </a>
            </p>
          </SidebarFooter>
        </Sidebar>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top action bar */}
          <header className="dark-panel border-b border-gold/30 sticky top-0 z-20">
            <div className="flex items-center gap-3 px-3 md:px-5 py-2.5">
              <SidebarTrigger className="text-parchment hover:text-gold hover:bg-gold/10" />
              <div className="gold-rule flex-1 max-w-[120px] hidden md:block" />
              <h2 className="hidden lg:block font-display text-sm tracking-wider text-parchment/80 truncate">
                {charName.trim() || "Personagem sem nome"}
              </h2>
              <div className="flex-1" />
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleLoad}
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Carregar</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    exportCharacterPdf({
                      charName,
                      playerName,
                      selectedRace,
                      selectedClass,
                      selectedSocialClass,
                      selectedReputation,
                      characterLevel,
                      sexo,
                      idade,
                      peso,
                      altura,
                      cabelos,
                      olhos,
                      tendencia,
                      attributes,
                      subAttributes,
                      purchasedItems,
                      addedItems,
                      customItems,
                      extraMoneyPc,
                      combatLoadout,
                      selectedAdvantages,
                      selectedRaceClassAdv,
                      selectedSkills,
                      selectedWeapons,
                      selectedWeaponGroups,
                      selectedShields,
                      grimoire,
                      divineAccess,
                      arcaneAccess,
                      arcaneSpecialist,
                      attributePointsSpent,
                      characterPointsSpent,
                      notesItems,
                      notesGeneral,
                      magicComponents,
                      characterHistory,
                    })
                  }
                  className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
                  title="Gerar ficha em PDF"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowEvolveDialog(true)}
                  className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs font-semibold shadow-[var(--shadow-gold)]"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Evoluir</span>
                </Button>
                {progressionHistory.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleUndoEvolve}
                    className="bg-blood/80 text-parchment hover:bg-blood font-body text-xs"
                    title="Desfazer última evolução"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 md:px-6 py-3 space-y-3 max-w-[1400px] w-full mx-auto">
            {/* Point Trackers */}
            <div className={`grid grid-cols-1 ${totalProgressionPoints > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-2 p-2.5 rounded-lg gilt-card`}>
              <PointTracker
                label="Pontos de Atributos"
                spent={attributePointsSpent}
                total={ATTRIBUTE_POINTS}
                breakdown={attributeBreakdown}
                detailsVariant="attributes"
              />
              <div className="flex flex-col gap-1">
                <PointTracker
                  label="Pontos de Personagem"
                  spent={characterPointsSpent}
                  total={CHARACTER_POINTS}
                  breakdown={characterBreakdown}
                />
                <div
                  className={`flex items-center justify-between gap-2 px-0.5 ${
                    disadvantagePoints >= MAX_DISADVANTAGE_POINTS
                      ? "text-blood"
                      : disadvantagePoints > 0
                        ? "text-blood/80"
                        : "text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1 font-display text-[9px] tracking-wider uppercase truncate">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Desvantagens
                  </span>
                  <span className="font-display text-[10px] tabular-nums shrink-0">
                    <span className={disadvantagePoints >= MAX_DISADVANTAGE_POINTS ? "font-bold" : ""}>
                      {disadvantagePoints}
                    </span>
                    <span className="opacity-70"> / {MAX_DISADVANTAGE_POINTS}</span>
                  </span>
                </div>
              </div>
              {totalProgressionPoints > 0 && (
                <PointTracker
                  label="Pontos de Progressão"
                  spent={progressionPointsSpent}
                  total={totalProgressionPoints}
                  breakdown={progressionBreakdown}
                  detailsVariant="progression"
                />
              )}
            </div>

            {/* Evolve Dialog */}
            <Dialog open={showEvolveDialog} onOpenChange={setShowEvolveDialog}>
              <DialogContent className="dark-panel border-gold/40 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-gold tracking-wider">
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Evoluir Personagem
                  </DialogTitle>
                  <DialogDescription className="text-parchment/60">
                    Ao atingir um novo nível, o personagem recebe Nível × 10 pontos de progressão.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="font-display text-xs tracking-wider uppercase text-parchment/70 mb-1 block">
                      Nível Alcançado
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={evolveLevel}
                      onChange={(e) => setEvolveLevel(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
                      className="w-full bg-background/50 border border-border rounded px-3 py-2 text-foreground font-body focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm">
                    <p className="text-muted-foreground">
                      Pontos a receber: <span className="text-gold font-bold text-base">{evolveLevel * 10}</span>
                    </p>
                    {progressionHistory.length > 0 && (
                      <p className="text-muted-foreground mt-1">
                        Total acumulado: <span className="font-bold">{totalProgressionPoints}</span> → <span className="font-bold text-gold">{totalProgressionPoints + evolveLevel * 10}</span>
                      </p>
                    )}
                  </div>
                  {progressionHistory.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-display tracking-wider uppercase mb-1">Histórico:</p>
                      {progressionHistory.map((entry, i) => (
                        <span key={i} className="inline-block mr-2 px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold-dark">
                          Nv.{entry.level} (+{entry.points})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowEvolveDialog(false)}
                    className="font-display text-xs tracking-wider"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEvolve}
                    className="bg-gold text-parchment-dark hover:bg-gold-dark font-display text-xs tracking-wider"
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Evoluir para Nível {evolveLevel}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Step Card */}
            <div className="rounded-xl gilt-card overflow-hidden">
              {/* Sub-tabs for steps that have them */}
              {stepSubTabs && (
                <div className="dark-panel border-b border-gold/20 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {stepSubTabs.map((tab) => {
                      const isActive =
                        STEPS[currentStep].label === "Vantagens"
                          ? advantageSubTab === tab.id
                          : magicAccessSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleStepSubTabClick(tab.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-body tracking-wide transition-all border ${
                            isActive
                              ? "bg-gold/25 text-gold border-gold/50"
                              : "text-parchment/55 hover:text-parchment hover:bg-parchment/5 border-transparent"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step Header */}
              <div className="px-4 pt-3 pb-2 border-b border-gold/15 bg-gradient-to-b from-gold/[0.04] to-transparent">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const StepIcon = STEPS[currentStep].icon;
                    return <StepIcon className="w-4 h-4 text-gold" />;
                  })()}
                  <h2 className="font-display text-lg tracking-wide text-foreground">
                    {activeStepSubTab?.label ?? STEPS[currentStep].label}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1 ml-6">
                  Passo {currentStep + 1} de {STEPS.length} —{" "}
                  {activeStepSubTab?.desc ?? STEPS[currentStep].desc}
                </p>
                <div className="gold-rule mt-2" />
              </div>

              {/* Step Content */}
              <div className="p-4">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="px-4 py-3 border-t border-gold/15 flex items-center justify-between bg-gradient-to-t from-gold/[0.04] to-transparent">
                <Button
                  size="sm"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="bg-parchment-dark text-parchment border border-gold/40 hover:bg-gold/20 font-body text-xs tracking-wide disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <span className="text-xs text-muted-foreground font-display">
                  {currentStep + 1} / {STEPS.length}
                </span>

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={goNext}
                    className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs tracking-wide font-semibold shadow-[var(--shadow-gold)]"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs tracking-wide font-semibold shadow-[var(--shadow-gold)]"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Salvar Personagem
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;

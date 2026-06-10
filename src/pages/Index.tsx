import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Shield, Swords, Scroll, BookOpen, User, Crosshair, Save, Upload, ChevronLeft, ChevronRight, Check, Sparkles, TrendingUp, Undo2, Heart, AlertTriangle, Coins, Award, FileText } from "lucide-react";
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
import MagicAccessPanel, { type DivineAccessLevel, type ArcaneAccessLevel } from "@/components/MagicAccessPanel";
import ResistancePanel from "@/components/ResistancePanel";
import EquipmentShopPanel from "@/components/EquipmentShopPanel";
import CombatPanel from "@/components/CombatPanel";
import SummaryPanel from "@/components/SummaryPanel";
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
  skills,
  type AttributeName,
} from "@/data/characterData";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import { subAttributeMap } from "@/data/subAttributes";
import { migratePurchasedItems, type PurchasedItems } from "@/data/equipment";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import {
  getAttributeBreakdown,
  getCharacterPointBreakdown,
  getProgressionBreakdown,
  GRIMOIRE_SPELL_POINT_COST,
} from "@/lib/pointBreakdown";
import { clampAttributesForRace } from "@/lib/clampAttributesForRace";
import {
  defaultCombatLoadout,
  sanitizeCombatLoadout,
  type CombatLoadout,
} from "@/lib/combatStats";

const ATTRIBUTE_POINTS = 75;
const CHARACTER_POINTS = 100;
/** Máximo de pontos recuperáveis via desvantagens (inclui classe social negativa). */
const MAX_DISADVANTAGE_POINTS = CHARACTER_POINTS;

const BASE_STEPS = [
  { label: "Identificação", icon: User, desc: "Dados básicos do personagem" },
  { label: "Atributos", icon: Shield, desc: "Distribua 75 pontos" },
  { label: "Raça & Classe", icon: User, desc: "Raça, classe, social e reputação" },
  { label: "Armas", icon: Crosshair, desc: "Proficiências com armas e escudos" },
  { label: "Perícias", icon: BookOpen, desc: "Perícias comuns do personagem" },
  { label: "Resistência", icon: Heart, desc: "Valores de resistência calculados" },
  { label: "Dinheiro & Equipamento", icon: Coins, desc: "Comprar equipamento com o capital da classe social" },
];

const COMBAT_STEP = { label: "Combate", icon: Swords, desc: "Pontos de Vida / Ataque / Categoria de Armadura" };
const MAGIC_ACCESS_STEP = { label: "Acesso a Magias", icon: Sparkles, desc: "Escolas arcanas e esferas divinas" };
const ADVANTAGES_STEP = {
  label: "Vantagens",
  icon: Award,
  desc: "Vantagens, desvantagens, poderes e antecedentes",
  hasSubTabs: true as const,
};
const MAGIC_STEP = { label: "Magia", icon: Sparkles, desc: "Grimório / Livro de Orações" };
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


const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Basic info
  const [charName, setCharName] = useState("");
  const [playerName, setPlayerName] = useState("");
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
    const steps = [...BASE_STEPS, MAGIC_ACCESS_STEP, ADVANTAGES_STEP];
    if (hasMagicAccess) steps.push(MAGIC_STEP);
    steps.push(COMBAT_STEP, SUMMARY_STEP);
    return steps;
  }, [hasMagicAccess]);

  const [advantageSubTab, setAdvantageSubTab] = useState<AdvantageSubTab>("gerais");

  const [selectedSocialClass, setSelectedSocialClass] = useState("Classe média baixa");
  const [selectedReputation, setSelectedReputation] = useState(0);
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [selectedRaceClassAdv, setSelectedRaceClassAdv] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedWeaponGroups, setSelectedWeaponGroups] = useState<string[]>([]);
  const [selectedShields, setSelectedShields] = useState<string[]>([]);
  const [grimoire, setGrimoire] = useState<string[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItems>({});
  const [combatLoadout, setCombatLoadout] = useState<CombatLoadout>(defaultCombatLoadout);

  useEffect(() => {
    setCombatLoadout((prev) => sanitizeCombatLoadout(prev, purchasedItems));
  }, [purchasedItems]);

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
      return sum + (skill?.cost ?? 0);
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
    const grimoireCost = grimoire.length * GRIMOIRE_SPELL_POINT_COST;

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

  const handleGrimoireToggle = (spellName: string) => {
    setGrimoire((prev) =>
      prev.includes(spellName) ? prev.filter((n) => n !== spellName) : [...prev, spellName]
    );
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
      combatLoadout,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${charName || "personagem"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [charName, playerName, sexo, idade, peso, altura, cabelos, olhos, tendencia, attributes, subAttributes, selectedRace, selectedClass, selectedSocialClass, selectedReputation, selectedAdvantages, selectedRaceClassAdv, selectedSkills, selectedWeapons, selectedWeaponGroups, selectedShields, grimoire, divineAccess, arcaneAccess, arcaneSpecialist, progressionHistory, purchasedItems, combatLoadout]);

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
        if (data.grimoire) setGrimoire(data.grimoire);
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
        if (data.combatLoadout) {
          setCombatLoadout(
            sanitizeCombatLoadout(
              { ...defaultCombatLoadout(), ...data.combatLoadout },
              migratedPurchased
            )
          );
        } else {
          setCombatLoadout(defaultCombatLoadout());
        }
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
        const inputCls = "w-full bg-background/50 border border-border rounded px-3 py-2 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold";
        const labelCls = "font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block";
        return (
          <div className="space-y-6">
            <p className="font-body text-muted-foreground text-sm">
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
            <p className="font-body text-muted-foreground text-sm">
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
            <p className="font-body text-muted-foreground text-sm">
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
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
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
      case "Dinheiro & Equipamento":
        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
              Use o capital da classe social para comprar armas, armaduras e equipamento. O peso total é comparado com a
              carga permitida (sub-atributo Resistência).
            </p>
            <EquipmentShopPanel
              selectedSocialClass={selectedSocialClass}
              subAttributes={subAttributes}
              purchased={purchasedItems}
              onPurchaseChange={setPurchasedItems}
            />
          </div>
        );
      case "Combate":
        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <CombatPanel
              subAttributes={subAttributes}
              attributes={attributes}
              purchased={purchasedItems}
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
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
              <p className="font-body text-muted-foreground text-sm">{subTab.desc}</p>
              <AdvantagesPanel {...panelProps} showRaceClass={false} />
            </div>
          );
        }

        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">{subTab.desc}</p>
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
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
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
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
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
      case "Acesso a Magias":
        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <MagicAccessPanel
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
      case "Magia":
        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
              Selecione as magias do personagem dentro das esferas e escolas acessíveis.
            </p>
            <MagicPanel
              grimoire={grimoire}
              onGrimoireToggle={handleGrimoireToggle}
              divineAccess={divineAccess}
              arcaneAccess={arcaneAccess}
              arcaneSpecialist={arcaneSpecialist}
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
            attributes={attributes}
            subAttributes={subAttributes}
            purchasedItems={purchasedItems}
            selectedAdvantages={selectedAdvantages}
            selectedRaceClassAdv={selectedRaceClassAdv}
            selectedSkills={selectedSkills}
            attributePointsSpent={attributePointsSpent}
            characterPointsSpent={characterPointsSpent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen parchment-bg">
      {/* Header */}
      <header className="dark-panel border-b border-gold/30">
        <div className="container max-w-6xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <AppLogo size={44} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display text-xl md:text-2xl tracking-widest text-parchment">
                AD&D 2.5 Edition - Criação de Personagens
              </h1>
              <p className="text-sm font-body">
                <a
                  href="http://adeide25.net.uztec.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-parchment/60 hover:text-gold hover:underline transition-colors"
                >
                  Sistema AD&D 2.5 - Pontos por Personagem v0.8
                </a>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
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
                className="bg-parchment-dark text-parchment border border-gold/40 hover:bg-gold/20 font-display text-xs tracking-wider"
              >
                <Upload className="w-4 h-4 mr-1" />
                Carregar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-parchment-dark text-parchment border border-gold/40 hover:bg-gold/20 font-display text-xs tracking-wider"
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar
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
                  })
                }
                className="bg-parchment-dark text-parchment border border-gold/40 hover:bg-gold/20 font-display text-xs tracking-wider"
                title="Gerar ficha em PDF"
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                size="sm"
                onClick={() => setShowEvolveDialog(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/80 font-display text-xs tracking-wider"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Evoluir
              </Button>
              {progressionHistory.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleUndoEvolve}
                  className="bg-blood/80 text-parchment hover:bg-blood font-display text-xs tracking-wider"
                  title="Desfazer última evolução"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              )}
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Point Trackers */}
        <div className={`grid grid-cols-1 ${totalProgressionPoints > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 p-4 rounded-lg bg-card/80 border border-border shadow-sm`}>
          <PointTracker
            label="Pontos de Atributos"
            spent={attributePointsSpent}
            total={ATTRIBUTE_POINTS}
            breakdown={attributeBreakdown}
            detailsVariant="attributes"
          />
          <PointTracker
            label="Pontos de Personagem"
            spent={characterPointsSpent}
            total={CHARACTER_POINTS}
            breakdown={characterBreakdown}
          />
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

        {/* Global Disadvantage Points Counter */}
        {disadvantagePoints > 0 && (
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              disadvantagePoints >= MAX_DISADVANTAGE_POINTS
                ? "bg-blood/20 border-blood/50"
                : "bg-blood/10 border-blood/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blood" />
              <span className="font-display text-sm tracking-wider text-foreground">
                Pontos de Desvantagem
              </span>
            </div>
            <span className="font-display text-lg text-blood font-bold">
              {disadvantagePoints}
              <span className="text-sm text-blood/70 font-normal"> / {MAX_DISADVANTAGE_POINTS}</span>
            </span>
          </div>
        )}

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
                  Pontos a receber: <span className="text-gold font-bold text-lg">{evolveLevel * 10}</span>
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

        {/* Wizard Stepper */}
        <div className="rounded-lg bg-card/80 border border-border shadow-sm overflow-hidden">
          {/* Step Indicators */}
          <div className="dark-panel border-b border-gold/20 px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-all text-xs font-display tracking-wider ${
                      isActive
                        ? "bg-gold/20 text-gold border border-gold/40"
                        : isDone
                        ? "text-gold/70 hover:text-gold hover:bg-gold/10 border border-transparent"
                        : "text-parchment/40 hover:text-parchment/60 hover:bg-parchment/5 border border-transparent"
                    }`}
                  >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-gold text-parchment-dark"
                        : isDone
                        ? "bg-gold/30 text-gold"
                        : "bg-parchment/10 text-parchment/40"
                    }`}>
                      {isDone ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className="hidden md:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>

            {"hasSubTabs" in STEPS[currentStep] && STEPS[currentStep].hasSubTabs && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-gold/15">
                {ADVANTAGE_SUB_TABS.map((tab) => {
                  const isActive = advantageSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAdvantageSubTab(tab.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-display tracking-wide transition-all border ${
                        isActive
                          ? "bg-gold/25 text-gold border-gold/50"
                          : "text-parchment/50 hover:text-parchment/80 hover:bg-parchment/5 border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step Header */}
          <div className="px-6 pt-5 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[currentStep].icon;
                return <StepIcon className="w-5 h-5 text-gold" />;
              })()}
              <h2 className="font-display text-lg tracking-wider text-foreground">
                {"hasSubTabs" in STEPS[currentStep] && STEPS[currentStep].hasSubTabs
                  ? ADVANTAGE_SUB_TABS.find((t) => t.id === advantageSubTab)?.label ?? STEPS[currentStep].label
                  : STEPS[currentStep].label}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-body mt-1 ml-7">
              Passo {currentStep + 1} de {STEPS.length} —{" "}
              {"hasSubTabs" in STEPS[currentStep] && STEPS[currentStep].hasSubTabs
                ? ADVANTAGE_SUB_TABS.find((t) => t.id === advantageSubTab)?.desc ?? STEPS[currentStep].desc
                : STEPS[currentStep].desc}
            </p>
          </div>

          {/* Step Content */}
          <div className="p-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
            <Button
              size="sm"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="bg-parchment-dark text-parchment border border-gold/40 hover:bg-gold/20 font-display text-xs tracking-wider disabled:opacity-30"
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
                className="bg-gold text-parchment-dark hover:bg-gold-dark font-display text-xs tracking-wider"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-gold text-parchment-dark hover:bg-gold-dark font-display text-xs tracking-wider"
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar Personagem
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

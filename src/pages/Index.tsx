import { useState, useMemo, useRef, useCallback } from "react";
import { Shield, Swords, Scroll, BookOpen, User, Crosshair, Save, Upload, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PointTracker from "@/components/PointTracker";
import AttributePanel from "@/components/AttributePanel";
import RaceClassPanel from "@/components/RaceClassPanel";
import AdvantagesPanel from "@/components/AdvantagesPanel";
import SkillsPanel from "@/components/SkillsPanel";
import WeaponProficiencyPanel from "@/components/WeaponProficiencyPanel";
import MagicPanel from "@/components/MagicPanel";
import { spellcastingClasses } from "@/data/spells";
import {
  attributeCosts,
  attributeNames,
  races,
  classes,
  socialClasses,
  generalAdvantages,
  generalDisadvantages,
  skills,
  type AttributeName,
} from "@/data/characterData";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import { subAttributeMap } from "@/data/subAttributes";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";

const ATTRIBUTE_POINTS = 75;
const CHARACTER_POINTS = 100;

const BASE_STEPS = [
  { label: "Identificação", icon: User, desc: "Nome e dados básicos" },
  { label: "Atributos", icon: Shield, desc: "Distribua 75 pontos" },
  { label: "Raça & Classe", icon: User, desc: "Escolha raça, classe e nível social" },
  { label: "Vantagens", icon: Swords, desc: "Vantagens e desvantagens" },
  { label: "Perícias", icon: BookOpen, desc: "Habilidades do personagem" },
  { label: "Armas", icon: Crosshair, desc: "Proficiências com armas e escudos" },
];

const MAGIC_STEP = { label: "Magia", icon: Sparkles, desc: "Grimório de magias" };
const SUMMARY_STEP = { label: "Resumo", icon: Scroll, desc: "Revisão final" };

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Basic info
  const [charName, setCharName] = useState("");
  const [playerName, setPlayerName] = useState("");

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

  const hasMagic = spellcastingClasses.includes(selectedClass);
  const STEPS = useMemo(() => {
    const steps = [...BASE_STEPS];
    if (hasMagic) steps.push(MAGIC_STEP);
    steps.push(SUMMARY_STEP);
    return steps;
  }, [hasMagic]);
  const [selectedSocialClass, setSelectedSocialClass] = useState("Classe média baixa");
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [selectedRaceClassAdv, setSelectedRaceClassAdv] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedWeaponGroups, setSelectedWeaponGroups] = useState<string[]>([]);
  const [selectedShields, setSelectedShields] = useState<string[]>([]);
  const [grimoire, setGrimoire] = useState<string[]>([]);

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

    return raceCost + classCost + socialCost + advCost + raceClassAdvCost + skillCost + weaponCost + groupCost + shieldCost;
  }, [selectedRace, selectedClass, selectedSocialClass, selectedAdvantages, selectedRaceClassAdv, selectedSkills, selectedWeapons, selectedWeaponGroups, selectedShields]);

  const handleAttributeChange = (attr: AttributeName, value: number) => {
    const newVal = Math.max(3, Math.min(18, value));
    setAttributes((prev) => ({ ...prev, [attr]: newVal }));
  };

  const handleSubAttributeChange = (subAttr: string, value: number) => {
    setSubAttributes((prev) => ({ ...prev, [subAttr]: value }));
  };

  const handleAdvantageToggle = (name: string) => {
    setSelectedAdvantages((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleRaceClassAdvToggle = (name: string) => {
    setSelectedRaceClassAdv((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    const data = {
      charName, playerName, attributes, subAttributes,
      selectedRace, selectedClass, selectedSocialClass,
      selectedAdvantages, selectedRaceClassAdv, selectedSkills,
      selectedWeapons, selectedWeaponGroups, selectedShields,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${charName || "personagem"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [charName, playerName, attributes, subAttributes, selectedRace, selectedClass, selectedSocialClass, selectedAdvantages, selectedRaceClassAdv, selectedSkills, selectedWeapons, selectedWeaponGroups, selectedShields]);

  const handleLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.charName !== undefined) setCharName(data.charName);
        if (data.playerName !== undefined) setPlayerName(data.playerName);
        if (data.attributes) setAttributes(data.attributes);
        if (data.subAttributes) setSubAttributes(data.subAttributes);
        if (data.selectedRace) setSelectedRace(data.selectedRace);
        if (data.selectedClass) setSelectedClass(data.selectedClass);
        if (data.selectedSocialClass) setSelectedSocialClass(data.selectedSocialClass);
        if (data.selectedAdvantages) setSelectedAdvantages(data.selectedAdvantages);
        if (data.selectedRaceClassAdv) setSelectedRaceClassAdv(data.selectedRaceClassAdv);
        if (data.selectedSkills) setSelectedSkills(data.selectedSkills);
        if (data.selectedWeapons) setSelectedWeapons(data.selectedWeapons);
        if (data.selectedWeaponGroups) setSelectedWeaponGroups(data.selectedWeaponGroups);
        if (data.selectedShields) setSelectedShields(data.selectedShields);
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
      case "Identificação":
        return (
          <div className="space-y-6">
            <p className="font-body text-muted-foreground text-sm">
              Comece dando um nome ao seu personagem e identificando o jogador.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block">
                  Nome do Personagem
                </label>
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="Ex: Thorin Escudo-de-Carvalho"
                  className="w-full bg-background/50 border border-border rounded px-3 py-2 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block">
                  Nome do Jogador
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-background/50 border border-border rounded px-3 py-2 text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        );
      case "Atributos":
        return (
          <div className="space-y-4">
            <p className="font-body text-muted-foreground text-sm">
              Distribua {ATTRIBUTE_POINTS} pontos entre os atributos. Cada um começa em 10.
            </p>
            <AttributePanel
              attributes={attributes}
              subAttributes={subAttributes}
              onChange={handleAttributeChange}
              onSubChange={handleSubAttributeChange}
            />
          </div>
        );
      case "Raça & Classe":
        return (
          <div className="space-y-4">
            <p className="font-body text-muted-foreground text-sm">
              Escolha a raça, classe e nível social do personagem. Cada opção consome pontos de personagem.
            </p>
            <RaceClassPanel
              selectedRace={selectedRace}
              selectedClass={selectedClass}
              selectedSocialClass={selectedSocialClass}
              onRaceChange={setSelectedRace}
              onClassChange={setSelectedClass}
              onSocialClassChange={setSelectedSocialClass}
            />
          </div>
        );
      case "Vantagens":
        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
              Selecione vantagens (custam pontos) e desvantagens (devolvem pontos).
            </p>
            <AdvantagesPanel
              selected={selectedAdvantages}
              onToggle={handleAdvantageToggle}
              selectedRaceClassAdvantages={selectedRaceClassAdv}
              onRaceClassToggle={handleRaceClassAdvToggle}
              selectedRace={selectedRace}
              selectedClass={selectedClass}
            />
          </div>
        );
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
      case "Magia":
        return (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            <p className="font-body text-muted-foreground text-sm">
              Grimório de referência para a classe <span className="text-foreground font-semibold">{selectedClass}</span>.
            </p>
            <MagicPanel selectedClass={selectedClass} />
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
            attributes={attributes}
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
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-gold" />
              <div>
                <h1 className="font-display text-xl md:text-2xl tracking-widest text-parchment">
                  AD&D Ficha de Pontos
                </h1>
                <p className="text-sm text-parchment/60 font-body">
                  Sistema de Pontos por Personagem v0.7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Point Trackers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-card/80 border border-border shadow-sm">
          <PointTracker
            label="Pontos de Atributos"
            spent={attributePointsSpent}
            total={ATTRIBUTE_POINTS}
          />
          <PointTracker
            label="Pontos de Personagem"
            spent={characterPointsSpent}
            total={CHARACTER_POINTS}
          />
        </div>

        {/* Wizard Stepper */}
        <div className="rounded-lg bg-card/80 border border-border shadow-sm overflow-hidden">
          {/* Step Indicators */}
          <div className="dark-panel border-b border-gold/20 px-4 py-3">
            <div className="flex items-center justify-between gap-1 overflow-x-auto">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-all text-xs font-display tracking-wider whitespace-nowrap ${
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
          </div>

          {/* Step Header */}
          <div className="px-6 pt-5 pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[currentStep].icon;
                return <StepIcon className="w-5 h-5 text-gold" />;
              })()}
              <h2 className="font-display text-lg tracking-wider text-foreground">
                {STEPS[currentStep].label}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-body mt-1 ml-7">
              Passo {currentStep + 1} de {STEPS.length} — {STEPS[currentStep].desc}
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

// Summary Panel Component
interface SummaryPanelProps {
  charName: string;
  playerName: string;
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  attributes: Record<AttributeName, number>;
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedSkills: string[];
  attributePointsSpent: number;
  characterPointsSpent: number;
}

const SummaryPanel = ({
  charName,
  playerName,
  selectedRace,
  selectedClass,
  selectedSocialClass,
  attributes,
  selectedAdvantages,
  selectedRaceClassAdv,
  selectedSkills,
  attributePointsSpent,
  characterPointsSpent,
}: SummaryPanelProps) => {
  const allAdvItems = [...generalAdvantages, ...generalDisadvantages];

  return (
    <div className="space-y-4">
      <div className="dark-panel rounded-lg p-4">
        <h3 className="font-display text-lg tracking-wider text-gold mb-3">
          {charName || "Personagem Sem Nome"}
        </h3>
        {playerName && (
          <p className="text-sm text-parchment/70 mb-2">Jogador: {playerName}</p>
        )}
        <div className="grid grid-cols-3 gap-2 text-sm text-parchment/80">
          <div>
            <span className="text-parchment/50">Raça:</span> {selectedRace}
          </div>
          <div>
            <span className="text-parchment/50">Classe:</span> {selectedClass}
          </div>
          <div>
            <span className="text-parchment/50">Social:</span> {selectedSocialClass}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <h4 className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-2">
          Atributos ({attributePointsSpent}/75 pts)
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {attributeNames.map((attr) => (
            <div key={attr} className="flex justify-between text-sm">
              <span className="font-display text-xs">{attr}</span>
              <span className="font-bold text-foreground">{attributes[attr]}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedAdvantages.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <h4 className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-2">
            Vantagens & Desvantagens
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedAdvantages.map((name) => {
              const item = allAdvItems.find((a) => a.name === name);
              const isAdv = item?.type === "advantage";
              return (
                <span
                  key={name}
                  className={`px-2 py-0.5 rounded text-xs font-body border ${
                    isAdv
                      ? "bg-gold/10 border-gold/30 text-gold-dark"
                      : "bg-blood/10 border-blood/30 text-blood"
                  }`}
                >
                  {name} ({item?.cost})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {selectedRaceClassAdv.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <h4 className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-2">
            Vantagens por Raça/Classe
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedRaceClassAdv.map((name) => {
              const item = raceClassAdvantages.find((a) => a.name === name);
              const isAdv = item?.type === "advantage";
              const matchesRace = item?.applicableRaces?.includes(selectedRace);
              const matchesClass = item?.applicableClasses?.includes(selectedClass);
              const cost = (matchesRace || matchesClass) ? item?.cost : (item?.costOthers ?? item?.cost);
              return (
                <span
                  key={name}
                  className={`px-2 py-0.5 rounded text-xs font-body border ${
                    isAdv
                      ? "bg-gold/10 border-gold/30 text-gold-dark"
                      : "bg-blood/10 border-blood/30 text-blood"
                  }`}
                >
                  {name} ({cost})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {selectedSkills.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <h4 className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-2">
            Perícias
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedSkills.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 rounded text-xs font-body border bg-gold/10 border-gold/30 text-gold-dark"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border-2 border-gold/40 p-3 bg-gold/5">
        <h4 className="font-display text-sm tracking-wider uppercase text-gold mb-2">
          Total de Pontos
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Atributos:</span>{" "}
            <span className={attributePointsSpent > 75 ? "text-blood font-bold" : "font-bold"}>
              {attributePointsSpent} / 75
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Personagem:</span>{" "}
            <span className={characterPointsSpent > 100 ? "text-blood font-bold" : "font-bold"}>
              {characterPointsSpent} / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

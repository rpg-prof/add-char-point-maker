import { useState, useMemo, useRef, useCallback } from "react";
import { Shield, Swords, Scroll, BookOpen, User, Crosshair, Save, Upload, HelpCircle, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PointTracker from "@/components/PointTracker";
import AttributePanel from "@/components/AttributePanel";
import RaceClassPanel from "@/components/RaceClassPanel";
import AdvantagesPanel from "@/components/AdvantagesPanel";
import SkillsPanel from "@/components/SkillsPanel";
import WeaponProficiencyPanel from "@/components/WeaponProficiencyPanel";
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

const Index = () => {
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

  // Sub-attributes (initialized to main attribute values)
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
  const [selectedSocialClass, setSelectedSocialClass] = useState("Classe média baixa");
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([]);
  const [selectedRaceClassAdv, setSelectedRaceClassAdv] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [selectedWeaponGroups, setSelectedWeaponGroups] = useState<string[]>([]);
  const [selectedShields, setSelectedShields] = useState<string[]>([]);

  // Calculate attribute points spent
  const attributePointsSpent = useMemo(
    () =>
      Object.values(attributes).reduce(
        (sum, val) => sum + val,
        0
      ),
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

    // Race/class-specific advantages cost
    const rcAdvCost = selectedRaceClassAdv.reduce((sum, name) => {
      const item = raceClassAdvantages.find((a) => a.name === name);
      if (!item) return sum;
      const matchesRace = item.applicableRaces?.includes(selectedRace);
      const matchesClass = item.applicableClasses?.includes(selectedClass);
      if (matchesRace || matchesClass) return sum + item.cost;
      return sum + (item.costOthers ?? item.cost);
    }, 0);

    const isClassSkill = (skillGroup: string) => {
      if (skillGroup === "Geral") return true;
      const classMap: Record<string, string[]> = {
        Guerreiro: ["Guerreiro", "Paladino", "Ranger"],
        "Ladrão/Bardo": ["Ladrão", "Bardo"],
        Sacerdote: ["Sacerdote"],
        Mago: ["Arcano"],
      };
      return classMap[skillGroup]?.includes(selectedClass) ?? false;
    };

    const skillCost = selectedSkills.reduce((sum, name) => {
      const skill = skills.find((s) => s.name === name);
      if (!skill) return sum;
      const cost = isClassSkill(skill.group) ? skill.cost : skill.cost * 2;
      return sum + cost;
    }, 0);

    // Weapon proficiency costs
    const weaponGroupCost = selectedWeaponGroups.reduce((sum, groupName) => {
      const group = weaponGroups.find((g) => g.name === groupName);
      return sum + (group?.costGroup ?? 0);
    }, 0);

    const weaponIndividualCost = selectedWeapons.reduce((sum, weaponKey) => {
      const [groupName] = weaponKey.split("::");
      // Skip if the whole group is already selected
      if (selectedWeaponGroups.includes(groupName)) return sum;
      const group = weaponGroups.find((g) => g.name === groupName);
      return sum + (group?.costPerWeapon ?? 0);
    }, 0);

    const shieldCost = selectedShields.reduce((sum, name) => {
      // If "Todos os Escudos" is selected, only count that
      if (selectedShields.includes("Todos os Escudos") && name !== "Todos os Escudos") return sum;
      const shield = shieldProficiencies.find((s) => s.name === name);
      return sum + (shield?.cost ?? 0);
    }, 0);

    return raceCost + classCost + socialCost + advCost + rcAdvCost + skillCost + weaponGroupCost + weaponIndividualCost + shieldCost;
  }, [selectedRace, selectedClass, selectedSocialClass, selectedAdvantages, selectedRaceClassAdv, selectedSkills, selectedWeapons, selectedWeaponGroups, selectedShields]);

  const handleAttributeChange = (attr: AttributeName, value: number) => {
    setAttributes((prev) => ({ ...prev, [attr]: value }));
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
      } catch {
        alert("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

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
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-gold/40 text-parchment hover:bg-gold/20"
              >
                <Upload className="w-4 h-4 mr-1" />
                Carregar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="border-gold/40 text-parchment hover:bg-gold/20"
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

        {/* Character Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-card/80 border border-border">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attributes - Left Column */}
          <div className="lg:col-span-1 p-4 rounded-lg bg-card/80 border border-border">
            <AttributePanel
              attributes={attributes}
              subAttributes={subAttributes}
              onChange={handleAttributeChange}
              onSubChange={handleSubAttributeChange}
            />
          </div>

          {/* Character Points - Right Column */}
          <div className="lg:col-span-2 p-4 rounded-lg bg-card/80 border border-border">
            <Tabs defaultValue="race" className="w-full">
              <TabsList className="w-full grid grid-cols-5 bg-parchment-dark/10 border border-border rounded-lg h-auto p-1">
                <TabsTrigger
                  value="race"
                  className="font-display text-xs tracking-wider data-[state=active]:bg-gold/20 data-[state=active]:text-foreground data-[state=active]:border-gold py-2 rounded border border-transparent"
                >
                  <User className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  Raça & Classe
                </TabsTrigger>
                <TabsTrigger
                  value="advantages"
                  className="font-display text-xs tracking-wider data-[state=active]:bg-gold/20 data-[state=active]:text-foreground data-[state=active]:border-gold py-2 rounded border border-transparent"
                >
                  <Swords className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  Vant./Desv.
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="font-display text-xs tracking-wider data-[state=active]:bg-gold/20 data-[state=active]:text-foreground data-[state=active]:border-gold py-2 rounded border border-transparent"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  Perícias
                </TabsTrigger>
                <TabsTrigger
                  value="weapons"
                  className="font-display text-xs tracking-wider data-[state=active]:bg-gold/20 data-[state=active]:text-foreground data-[state=active]:border-gold py-2 rounded border border-transparent"
                >
                  <Crosshair className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  Armas
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="font-display text-xs tracking-wider data-[state=active]:bg-gold/20 data-[state=active]:text-foreground data-[state=active]:border-gold py-2 rounded border border-transparent"
                >
                  <Scroll className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  Resumo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="race" className="mt-4">
                <RaceClassPanel
                  selectedRace={selectedRace}
                  selectedClass={selectedClass}
                  selectedSocialClass={selectedSocialClass}
                  onRaceChange={setSelectedRace}
                  onClassChange={setSelectedClass}
                  onSocialClassChange={setSelectedSocialClass}
                />
              </TabsContent>

              <TabsContent value="advantages" className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <AdvantagesPanel
                  selected={selectedAdvantages}
                  onToggle={handleAdvantageToggle}
                  selectedRaceClassAdvantages={selectedRaceClassAdv}
                  onRaceClassToggle={handleRaceClassAdvToggle}
                  selectedRace={selectedRace}
                  selectedClass={selectedClass}
                />
              </TabsContent>

              <TabsContent value="skills" className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <SkillsPanel
                  selected={selectedSkills}
                  onToggle={handleSkillToggle}
                  characterClass={selectedClass}
                />
              </TabsContent>

              <TabsContent value="weapons" className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <WeaponProficiencyPanel
                  selectedWeapons={selectedWeapons}
                  selectedGroups={selectedWeaponGroups}
                  selectedShields={selectedShields}
                  onWeaponToggle={handleWeaponToggle}
                  onGroupToggle={handleWeaponGroupToggle}
                  onShieldToggle={handleShieldToggle}
                />
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
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
              </TabsContent>
            </Tabs>
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

      {/* Attributes Summary */}
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

      {/* Advantages */}
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

      {/* Race/Class Advantages */}
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

      {/* Totals */}
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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  TrendingUp,
  Swords,
  Sparkles,
  Award,
  BookOpen,
  Crosshair,
  Heart,
  Scroll,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/AppLogo";
import PointTracker from "@/components/PointTracker";
import CharacterOverviewPanel from "@/components/CharacterOverviewPanel";
import EvolutionLevelPanel from "@/components/EvolutionLevelPanel";
import EvolutionCombatPanel from "@/components/EvolutionCombatPanel";
import EvolutionMagicPanel from "@/components/EvolutionMagicPanel";
import EvolutionPowersPanel from "@/components/EvolutionPowersPanel";
import SkillsPanel from "@/components/SkillsPanel";
import WeaponProficiencyPanel from "@/components/WeaponProficiencyPanel";
import EvolutionResistancePanel from "@/components/EvolutionResistancePanel";
import SummaryPanel from "@/components/SummaryPanel";
import {
  createEmptyCharacterSave,
  getActiveCharacter,
  mergeEvolutionIntoCharacter,
  consumeCharacterHandoff,
  setActiveCharacter,
  type CharacterSaveData,
} from "@/lib/characterSave";
import { getSkillCost, skills } from "@/data/skills";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import {
  characterLevelFromHistory,
  createProgressionEntry,
  defaultEvolutionProgress,
  getEvolutionResistanceBonuses,
  getEvolutionSpendBreakdown,
  hasBackstabAdvantage,
  sumEvolutionSpent,
  totalProgressionPoints,
  type EvolutionProgress,
} from "@/lib/evolutionProgress";

const DEFAULT_PAGE_TITLE = "AD&D 2.5 Edition - Evolução de Personagem";
const NAMED_PAGE_TITLE_SUFFIX = "AD&D 2.5 Edition - Evolução";

const STEPS = [
  { label: "Personagem", icon: User, desc: "Visão geral do personagem carregado" },
  { label: "Nível", icon: TrendingUp, desc: "Subir de nível e pontos de progressão" },
  { label: "Combate", icon: Swords, desc: "PV, base de ataque e ataques/rodada" },
  { label: "Magia", icon: Sparkles, desc: "Nível de magia, pontos de magia e Chi" },
  { label: "Poderes", icon: Award, desc: "Poderes de classe" },
  { label: "Perícias", icon: BookOpen, desc: "Novas perícias e bônus" },
  { label: "Armas", icon: Crosshair, desc: "Proficiências com armas" },
  { label: "Resistência", icon: Heart, desc: "Melhorar resistências" },
  { label: "Resumo", icon: Scroll, desc: "Revisão e salvar" },
];

const Evolution = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [char, setChar] = useState<CharacterSaveData>(() => createEmptyCharacterSave());

  const evolution = char.evolutionProgress ?? defaultEvolutionProgress();

  useEffect(() => {
    const trimmed = char.charName.trim();
    document.title = trimmed
      ? `${trimmed} - ${NAMED_PAGE_TITLE_SUFFIX}`
      : DEFAULT_PAGE_TITLE;
  }, [char.charName]);

  useEffect(() => {
    const incoming = consumeCharacterHandoff() ?? getActiveCharacter();
    if (!incoming) {
      navigate("/", { replace: true });
      return;
    }
    setChar(incoming);
    setLoaded(true);
    setCurrentStep(0);
  }, [navigate]);

  const hasMagicAccess =
    Object.keys(char.divineAccess).length > 0 ||
    Object.keys(char.arcaneAccess).length > 0 ||
    char.arcaneSpecialist !== null;

  const hasArcaneAccess =
    Object.keys(char.arcaneAccess).length > 0 || char.arcaneSpecialist !== null;
  const hasDivineAccess = Object.keys(char.divineAccess).length > 0;

  const characterLevel = useMemo(
    () => characterLevelFromHistory(char.progressionHistory),
    [char.progressionHistory],
  );

  const totalPP = useMemo(
    () => totalProgressionPoints(char.progressionHistory),
    [char.progressionHistory],
  );

  const spendContext = useMemo(
    () => ({
      selectedClass: char.selectedClass,
      selectedRace: char.selectedRace,
      selectedSkills: char.selectedSkills,
      selectedRaceClassAdv: char.selectedRaceClassAdv,
      evolutionRaceClassAdv: evolution.evolutionRaceClassAdv,
      arcaneSpecialist: char.arcaneSpecialist,
      hasArcaneAccess,
      hasDivineAccess,
    }),
    [char, evolution.evolutionRaceClassAdv, hasArcaneAccess, hasDivineAccess],
  );

  const characterHasBackstab = useMemo(
    () =>
      hasBackstabAdvantage(char.selectedRaceClassAdv, evolution.evolutionRaceClassAdv),
    [char.selectedRaceClassAdv, evolution.evolutionRaceClassAdv],
  );

  const evolutionBreakdown = useMemo(
    () => getEvolutionSpendBreakdown(evolution, spendContext),
    [evolution, spendContext],
  );

  const progressionSpent = useMemo(
    () => sumEvolutionSpent(evolutionBreakdown),
    [evolutionBreakdown],
  );

  const availablePoints = totalPP - progressionSpent;

  const setEvolution = useCallback((next: EvolutionProgress) => {
    setChar((prev) => ({ ...prev, evolutionProgress: next }));
  }, []);

  const handleReturnToPlay = useCallback(() => {
    setActiveCharacter(char);
    navigate("/play");
  }, [char, navigate]);

  const handleEvolve = useCallback((level: number) => {
    setChar((prev) => ({
      ...prev,
      progressionHistory: [...prev.progressionHistory, createProgressionEntry(level)],
    }));
  }, []);

  const handleUndoEvolve = useCallback(() => {
    setChar((prev) => ({
      ...prev,
      progressionHistory: prev.progressionHistory.slice(0, -1),
    }));
  }, []);

  const allSkills = useMemo(
    () => [...char.selectedSkills, ...evolution.evolutionSkills],
    [char.selectedSkills, evolution.evolutionSkills],
  );

  const allWeapons = useMemo(
    () => [...char.selectedWeapons, ...evolution.evolutionWeapons],
    [char.selectedWeapons, evolution.evolutionWeapons],
  );

  const allWeaponGroups = useMemo(
    () => [...char.selectedWeaponGroups, ...evolution.evolutionWeaponGroups],
    [char.selectedWeaponGroups, evolution.evolutionWeaponGroups],
  );

  const allShields = useMemo(
    () => [...char.selectedShields, ...evolution.evolutionShields],
    [char.selectedShields, evolution.evolutionShields],
  );

  const handleSkillToggle = (name: string) => {
    const isCreation = char.selectedSkills.includes(name);
    const isEvo = evolution.evolutionSkills.includes(name);
    if (isCreation) return;

    if (isEvo) {
      setEvolution({
        ...evolution,
        evolutionSkills: evolution.evolutionSkills.filter((n) => n !== name),
      });
      return;
    }

    const skill = skills.find((s) => s.name === name);
    if (!skill) return;
    const cost = getSkillCost(skill, char.selectedClass);
    if (cost > availablePoints) return;

    setEvolution({
      ...evolution,
      evolutionSkills: [...evolution.evolutionSkills, name],
    });
  };

  const handleWeaponToggle = (weaponKey: string) => {
    const isCreation = char.selectedWeapons.includes(weaponKey);
    const isEvo = evolution.evolutionWeapons.includes(weaponKey);
    if (isCreation) return;

    if (isEvo) {
      setEvolution({
        ...evolution,
        evolutionWeapons: evolution.evolutionWeapons.filter((n) => n !== weaponKey),
      });
      return;
    }

    const [groupName] = weaponKey.split("::");
    if (allWeaponGroups.includes(groupName)) return;
    const group = weaponGroups.find((g) => g.name === groupName);
    const cost = group?.costPerWeapon ?? 0;
    if (cost > availablePoints) return;

    setEvolution({
      ...evolution,
      evolutionWeapons: [...evolution.evolutionWeapons, weaponKey],
    });
  };

  const handleWeaponGroupToggle = (groupName: string) => {
    const isCreation = char.selectedWeaponGroups.includes(groupName);
    const isEvo = evolution.evolutionWeaponGroups.includes(groupName);
    if (isCreation) return;

    if (isEvo) {
      setEvolution({
        ...evolution,
        evolutionWeaponGroups: evolution.evolutionWeaponGroups.filter((n) => n !== groupName),
      });
      return;
    }

    const group = weaponGroups.find((g) => g.name === groupName);
    const cost = group?.costGroup ?? 0;
    if (cost > availablePoints) return;

    setEvolution({
      ...evolution,
      evolutionWeaponGroups: [...evolution.evolutionWeaponGroups, groupName],
    });
  };

  const handleShieldToggle = (shieldName: string) => {
    const isCreation = char.selectedShields.includes(shieldName);
    const isEvo = evolution.evolutionShields.includes(shieldName);
    if (isCreation) return;

    if (isEvo) {
      setEvolution({
        ...evolution,
        evolutionShields: evolution.evolutionShields.filter((n) => n !== shieldName),
      });
      return;
    }

    const shield = shieldProficiencies.find((s) => s.name === shieldName);
    const cost = shield?.cost ?? 0;
    if (cost > availablePoints) return;

    setEvolution({
      ...evolution,
      evolutionShields: [...evolution.evolutionShields, shieldName],
    });
  };

  const evolutionResistanceBonuses = useMemo(
    () => getEvolutionResistanceBonuses(evolution),
    [evolution],
  );

  const goNext = () => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goPrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  const renderStepContent = () => {
    if (!loaded) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="font-body text-sm text-muted-foreground">
            Abrindo personagem…
          </p>
          <Link to="/" className="text-gold hover:underline text-xs font-body">
            Voltar ao início
          </Link>
        </div>
      );
    }

    const step = STEPS[currentStep];
    switch (step.label) {
      case "Personagem":
        return (
          <CharacterOverviewPanel
            charName={char.charName}
            playerName={char.playerName}
            selectedRace={char.selectedRace}
            selectedClass={char.selectedClass}
            selectedSocialClass={char.selectedSocialClass}
            characterLevel={characterLevel}
            attributes={char.attributes}
            subAttributes={char.subAttributes}
            sexo={char.sexo}
            idade={char.idade}
            tendencia={char.tendencia}
          />
        );
      case "Nível":
        return (
          <EvolutionLevelPanel
            selectedClass={char.selectedClass}
            characterLevel={characterLevel}
            progressionHistory={char.progressionHistory}
            totalProgressionPoints={totalPP}
            progressionSpent={progressionSpent}
            onEvolve={handleEvolve}
            onUndoEvolve={handleUndoEvolve}
          />
        );
      case "Combate":
        return (
          <EvolutionCombatPanel
            characterLevel={characterLevel}
            progress={evolution}
            availablePoints={availablePoints}
            hasBackstabAdvantage={characterHasBackstab}
            onChange={setEvolution}
          />
        );
      case "Magia":
        return (
          <EvolutionMagicPanel
            progress={evolution}
            availablePoints={availablePoints}
            hasMagicAccess={hasMagicAccess}
            hasArcaneAccess={hasArcaneAccess}
            hasDivineAccess={hasDivineAccess}
            arcaneSpecialist={char.arcaneSpecialist}
            onChange={setEvolution}
          />
        );
      case "Poderes":
        return (
          <EvolutionPowersPanel
            selectedRace={char.selectedRace}
            selectedClass={char.selectedClass}
            selectedRaceClassAdv={char.selectedRaceClassAdv}
            progress={evolution}
            availablePoints={availablePoints}
            onChange={setEvolution}
          />
        );
      case "Perícias":
        return (
          <div className="space-y-3">
            <p className="font-body text-muted-foreground text-xs">
              Perícias já adquiridas na criação aparecem selecionadas e não podem ser removidas.
              Novas perícias custam o valor normal em pontos de progressão.
            </p>
            <SkillsPanel
              selected={allSkills}
              onToggle={handleSkillToggle}
              characterClass={char.selectedClass}
            />
          </div>
        );
      case "Armas":
        return (
          <div className="space-y-3">
            <p className="font-body text-muted-foreground text-xs">
              Proficiências da criação são fixas. Novas proficiências usam pontos de progressão.
            </p>
            <WeaponProficiencyPanel
              selectedWeapons={allWeapons}
              selectedGroups={allWeaponGroups}
              selectedShields={allShields}
              onWeaponToggle={handleWeaponToggle}
              onGroupToggle={handleWeaponGroupToggle}
              onShieldToggle={handleShieldToggle}
            />
          </div>
        );
      case "Resistência":
        return (
          <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-2">
            <EvolutionResistancePanel
              characterLevel={characterLevel}
              progress={evolution}
              availablePoints={availablePoints}
              subAttributes={char.subAttributes}
              selectedRaceClassAdv={char.selectedRaceClassAdv}
              onChange={setEvolution}
            />
          </div>
        );
      case "Resumo": {
        const merged = mergeEvolutionIntoCharacter(char);
        return (
          <SummaryPanel
            charName={merged.charName}
            playerName={merged.playerName}
            selectedRace={merged.selectedRace}
            selectedClass={merged.selectedClass}
            selectedSocialClass={merged.selectedSocialClass}
            selectedReputation={merged.selectedReputation}
            characterLevel={characterLevel}
            attributes={merged.attributes}
            subAttributes={merged.subAttributes}
            purchasedItems={merged.purchasedItems}
            addedItems={merged.addedItems}
            customItems={merged.customItems}
            extraMoneyPc={merged.extraMoneyPc}
            selectedAdvantages={merged.selectedAdvantages}
            selectedRaceClassAdv={merged.selectedRaceClassAdv}
            selectedSkills={merged.selectedSkills}
            sexo={merged.sexo}
            idade={merged.idade}
            peso={merged.peso}
            altura={merged.altura}
            cabelos={merged.cabelos}
            olhos={merged.olhos}
            tendencia={merged.tendencia}
            combatLoadout={merged.combatLoadout}
            selectedWeapons={merged.selectedWeapons}
            selectedWeaponGroups={merged.selectedWeaponGroups}
            selectedShields={merged.selectedShields}
            evolutionResistanceBonus={evolutionResistanceBonuses}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full parchment-bg">
        <Sidebar collapsible="icon" className="border-r border-gold/30">
          <SidebarHeader className="dark-panel border-b border-gold/30">
            <div className="flex items-center gap-2.5 px-2 py-2 min-w-0">
              <AppLogo size={36} className="shrink-0" />
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <h1 className="font-display text-sm leading-tight text-gold tracking-wide truncate">
                  AD&amp;D 2.5
                </h1>
                <p className="font-body text-[10px] text-parchment/60 leading-tight">
                  Evolução de Personagem
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
                    const disabled = !loaded;
                    return (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuButton
                          onClick={() => loaded && setCurrentStep(i)}
                          isActive={isActive}
                          disabled={disabled}
                          tooltip={step.label}
                          className={`font-body group/step ${
                            disabled
                              ? "opacity-40 cursor-not-allowed"
                              : isActive
                                ? "bg-gold/15 text-gold border-l-2 border-gold"
                                : isDone
                                  ? "text-gold/70 hover:text-gold hover:bg-gold/10"
                                  : "text-parchment/55 hover:text-parchment hover:bg-parchment/5"
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0 ${
                              isActive
                                ? "bg-gold text-parchment-dark"
                                : isDone
                                  ? "bg-gold/30 text-gold"
                                  : "bg-parchment/10 text-parchment/50"
                            }`}
                          >
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
              Evolução de Personagem
            </p>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="dark-panel border-b border-gold/30 sticky top-0 z-20">
            <div className="flex items-center gap-3 px-3 md:px-5 py-2.5">
              <SidebarTrigger className="text-parchment hover:text-gold hover:bg-gold/10" />
              <div className="gold-rule flex-1 max-w-[120px] hidden md:block" />
              <h2 className="hidden lg:block font-display text-sm tracking-wider text-parchment/80 truncate">
                {char.charName.trim() || "Evolução de Personagem"}
              </h2>
              <div className="flex-1" />
              {loaded && (
                <Button
                  size="sm"
                  onClick={handleReturnToPlay}
                  className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs font-semibold shadow-[var(--shadow-gold)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Voltar à Ficha
                </Button>
              )}
            </div>
          </header>

          <main className="flex-1 px-3 md:px-6 py-3 space-y-3 max-w-[1400px] w-full mx-auto">
            {loaded && (
              <div className="p-2.5 rounded-lg gilt-card">
                <PointTracker
                  label="Pontos de Progressão"
                  spent={progressionSpent}
                  total={totalPP}
                  breakdown={evolutionBreakdown}
                  detailsVariant="progression"
                />
              </div>
            )}

            <div className="rounded-xl gilt-card overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-gold/15 bg-gradient-to-b from-gold/[0.04] to-transparent">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const StepIcon = STEPS[currentStep].icon;
                    return <StepIcon className="w-4 h-4 text-gold" />;
                  })()}
                  <h2 className="font-display text-lg tracking-wide text-foreground">
                    {STEPS[currentStep].label}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1 ml-6">
                  Passo {currentStep + 1} de {STEPS.length} — {STEPS[currentStep].desc}
                </p>
                <div className="gold-rule mt-2" />
              </div>

              <div className="p-4">{renderStepContent()}</div>

              {loaded && (
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
                      onClick={handleReturnToPlay}
                      className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs tracking-wide font-semibold shadow-[var(--shadow-gold)]"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Concluir e Ir à Ficha
                    </Button>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Evolution;

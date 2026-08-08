import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Heart,
  Home as HomeIcon,
  Package,
  Pencil,
  Save,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TrendingUp,
  User,
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import CharacterIdentityCard from "@/components/CharacterIdentityCard";
import PlayAdvantagesPanel from "@/components/PlayAdvantagesPanel";
import PlayArmorPanel from "@/components/PlayArmorPanel";
import PlayAttributesPanel from "@/components/PlayAttributesPanel";
import PlayPowersPanel from "@/components/PlayPowersPanel";
import PlayResistancesPanel from "@/components/PlayResistancesPanel";
import PlaySessionPanel from "@/components/PlaySessionPanel";
import PlaySkillsPanel from "@/components/PlaySkillsPanel";
import PlayWeaponsPanel from "@/components/PlayWeaponsPanel";
import { Button } from "@/components/ui/button";
import {
  downloadCharacterSave,
  getActiveCharacter,
  mergeEvolutionIntoCharacter,
  setActiveCharacter,
  stashCharacterHandoff,
  type CharacterSaveData,
} from "@/lib/characterSave";
import { exportCharacterPdf } from "@/lib/exportCharacterPdf";
import {
  characterLevelFromHistory,
  getEvolutionResistanceBonuses,
} from "@/lib/evolutionProgress";
import { defaultCombatLoadout } from "@/lib/combatStats";

const DEFAULT_PAGE_TITLE = "AD&D 2.5 Edition - Ficha de Personagem";
const NAMED_PAGE_TITLE_SUFFIX = "AD&D 2.5 Edition - Ficha";

function PlaySection({
  icon,
  title,
  children,
  dense = false,
  headerAction,
  className,
  bodyClassName,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  dense?: boolean;
  headerAction?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-xl gilt-card overflow-hidden border-l-[3px] border-l-gold/35 flex flex-col ${
        className ?? "h-full"
      }`}
    >
      <div
        className={`border-b border-gold/15 bg-gradient-to-r from-gold/[0.07] via-gold/[0.02] to-transparent flex items-center justify-between gap-2 shrink-0 ${
          dense ? "px-3 pt-2.5 pb-2" : "px-4 pt-3 pb-2.5"
        }`}
      >
        <h2 className="font-display text-meta tracking-wide text-foreground flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center rounded-md border border-gold/25 bg-gold/10 text-gold p-1 shrink-0">
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </h2>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div
        className={`${dense ? "p-2.5" : "p-3.5 md:p-4"} flex-1 min-h-0 ${bodyClassName ?? ""}`}
      >
        {children}
      </div>
    </section>
  );
}

const Play = () => {
  const navigate = useNavigate();
  const [char, setChar] = useState<CharacterSaveData | null>(() => getActiveCharacter());
  const [armorEditOpen, setArmorEditOpen] = useState(false);

  useEffect(() => {
    if (!char) {
      navigate("/", { replace: true });
      return;
    }
    setActiveCharacter(char);
  }, [char, navigate]);

  useEffect(() => {
    if (!char) {
      document.title = DEFAULT_PAGE_TITLE;
      return;
    }
    const trimmed = char.charName.trim();
    document.title = trimmed
      ? `${trimmed} - ${NAMED_PAGE_TITLE_SUFFIX}`
      : DEFAULT_PAGE_TITLE;
  }, [char]);

  const updateChar = useCallback((next: CharacterSaveData) => {
    setChar(next);
    setActiveCharacter(next);
  }, []);

  const displayChar = useMemo(
    () => (char ? mergeEvolutionIntoCharacter(char) : null),
    [char],
  );

  const characterLevel = useMemo(
    () => (char ? characterLevelFromHistory(char.progressionHistory) : 1),
    [char],
  );

  const evolutionResistanceBonus = useMemo(
    () => (char?.evolutionProgress ? getEvolutionResistanceBonuses(char.evolutionProgress) : {}),
    [char],
  );

  const loadout = displayChar?.combatLoadout ?? defaultCombatLoadout();

  const handleSave = useCallback(() => {
    if (!char) return;
    downloadCharacterSave(char);
  }, [char]);

  const handleEdit = useCallback(() => {
    if (!char) return;
    stashCharacterHandoff(char);
    navigate("/create");
  }, [char, navigate]);

  const handleEvolve = useCallback(() => {
    if (!char) return;
    stashCharacterHandoff(char);
    navigate("/evolution");
  }, [char, navigate]);

  const handlePdf = useCallback(() => {
    if (!displayChar) return;
    exportCharacterPdf({
      charName: displayChar.charName,
      playerName: displayChar.playerName,
      selectedRace: displayChar.selectedRace,
      selectedClass: displayChar.selectedClass,
      selectedSocialClass: displayChar.selectedSocialClass,
      selectedReputation: displayChar.selectedReputation,
      characterLevel,
      sexo: displayChar.sexo,
      idade: displayChar.idade,
      peso: displayChar.peso,
      altura: displayChar.altura,
      cabelos: displayChar.cabelos,
      olhos: displayChar.olhos,
      tendencia: displayChar.tendencia,
      attributes: displayChar.attributes,
      subAttributes: displayChar.subAttributes,
      purchasedItems: displayChar.purchasedItems,
      addedItems: displayChar.addedItems,
      customItems: displayChar.customItems,
      extraMoneyPc: displayChar.extraMoneyPc,
      combatLoadout: displayChar.combatLoadout,
      selectedAdvantages: displayChar.selectedAdvantages,
      selectedRaceClassAdv: displayChar.selectedRaceClassAdv,
      selectedSkills: displayChar.selectedSkills,
      selectedWeapons: displayChar.selectedWeapons,
      selectedWeaponGroups: displayChar.selectedWeaponGroups,
      selectedShields: displayChar.selectedShields,
      grimoire: displayChar.grimoire,
      divineAccess: displayChar.divineAccess,
      arcaneAccess: displayChar.arcaneAccess,
      arcaneSpecialist: displayChar.arcaneSpecialist,
      attributePointsSpent: 0,
      characterPointsSpent: 0,
      evolutionResistanceBonus,
      notesItems: displayChar.notesItems,
      notesGeneral: displayChar.notesGeneral,
      magicComponents: displayChar.magicComponents,
      characterHistory: displayChar.characterHistory,
    });
  }, [displayChar, characterLevel, evolutionResistanceBonus]);

  if (!char || !displayChar) {
    return null;
  }

  return (
    <div className="min-h-screen parchment-bg">
      <header className="dark-panel border-b border-gold/30 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-3 md:px-5 py-2.5">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 hover:opacity-90">
            <AppLogo size={36} className="shrink-0" />
            <div className="min-w-0 hidden sm:block">
              <h1 className="font-display text-field leading-tight text-gold tracking-wide truncate">
                AD&amp;D 2.5
              </h1>
              <p className="font-body text-micro text-parchment/60 leading-tight">
                Ficha de Personagem
              </p>
            </div>
          </Link>

          <div className="gold-rule flex-1 max-w-[80px] hidden md:block" />
          <h2 className="hidden md:block font-display text-field tracking-wider text-parchment/80 truncate">
            {displayChar.charName.trim() || "Personagem sem nome"}
            <span className="text-parchment/45 font-body text-meta ml-2">
              Nv. {characterLevel} · {displayChar.selectedRace} · {displayChar.selectedClass}
            </span>
          </h2>
          <div className="flex-1" />

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button
              size="sm"
              asChild
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-meta"
              title="Voltar ao início"
            >
              <Link to="/">
                <HomeIcon className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Início</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-meta"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePdf}
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-meta"
              title="Gerar ficha em PDF"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-meta"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              size="sm"
              onClick={handleEvolve}
              className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-meta font-semibold shadow-[var(--shadow-gold)]"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Evoluir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 md:px-5 py-5 space-y-4">
        <CharacterIdentityCard
          charName={displayChar.charName}
          playerName={displayChar.playerName}
          selectedRace={displayChar.selectedRace}
          selectedClass={displayChar.selectedClass}
          selectedSocialClass={displayChar.selectedSocialClass}
          selectedReputation={displayChar.selectedReputation}
          characterLevel={characterLevel}
          sexo={displayChar.sexo}
          idade={displayChar.idade}
          peso={displayChar.peso}
          altura={displayChar.altura}
          cabelos={displayChar.cabelos}
          olhos={displayChar.olhos}
          tendencia={displayChar.tendencia}
        />

        {/* Topo: Atributos | Armas | Sessão */}
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:items-start">
          <div className="w-full lg:w-[15.5rem] lg:shrink-0 min-w-0 space-y-3 md:space-y-4">
            <PlaySection dense icon={<User className="w-3.5 h-3.5" />} title="Atributos">
              <PlayAttributesPanel
                attributes={displayChar.attributes}
                subAttributes={displayChar.subAttributes}
              />
            </PlaySection>

            <PlaySection dense icon={<Heart className="w-3.5 h-3.5" />} title="Resistências">
              <PlayResistancesPanel
                compact
                subAttributes={displayChar.subAttributes}
                selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
                evolutionResistanceBonus={evolutionResistanceBonus}
              />
            </PlaySection>

            <PlaySection dense icon={<Sparkles className="w-3.5 h-3.5" />} title="Poderes">
              <PlayPowersPanel
                selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
                evolutionProgress={char.evolutionProgress}
              />
            </PlaySection>
          </div>

          <div className="flex-1 min-w-0 order-last lg:order-none space-y-3 md:space-y-4">
            <PlaySection
              dense
              icon={<Swords className="w-3.5 h-3.5" />}
              title="Armas e perícias com armas"
            >
              <PlayWeaponsPanel
                attributes={displayChar.attributes}
                subAttributes={displayChar.subAttributes}
                purchasedItems={displayChar.purchasedItems}
                addedItems={displayChar.addedItems}
                customItems={displayChar.customItems}
                selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
                selectedAdvantages={displayChar.selectedAdvantages}
                selectedWeapons={displayChar.selectedWeapons}
                selectedWeaponGroups={displayChar.selectedWeaponGroups}
                selectedShields={displayChar.selectedShields}
                characterLevel={characterLevel}
                loadout={loadout}
                onLoadoutChange={(combatLoadout) => updateChar({ ...char, combatLoadout })}
              />
            </PlaySection>

            <PlaySection
              dense
              icon={<Shield className="w-3.5 h-3.5" />}
              title="Armadura"
              headerAction={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setArmorEditOpen(true)}
                  className="h-6 px-2 bg-background/60 border-gold/35 text-foreground hover:bg-gold/10 hover:text-gold font-body text-meta"
                  title="Editar armadura"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              }
            >
              <PlayArmorPanel
                attributes={displayChar.attributes}
                subAttributes={displayChar.subAttributes}
                purchasedItems={displayChar.purchasedItems}
                addedItems={displayChar.addedItems}
                selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
                loadout={loadout}
                onLoadoutChange={(combatLoadout) => updateChar({ ...char, combatLoadout })}
                editOpen={armorEditOpen}
                onEditOpenChange={setArmorEditOpen}
              />
            </PlaySection>

            <PlaySection dense icon={<BookOpen className="w-3.5 h-3.5" />} title="Perícias comuns">
              <PlaySkillsPanel
                selectedSkills={displayChar.selectedSkills}
                selectedClass={displayChar.selectedClass}
                skillLevels={char.evolutionProgress?.skillLevels}
              />
            </PlaySection>
          </div>

          <div className="w-full lg:w-[13.5rem] lg:shrink-0 min-w-0 space-y-3 md:space-y-4">
            <PlaySection
              dense
              icon={<Package className="w-3.5 h-3.5" />}
              title="Sessão"
              bodyClassName="flex flex-col"
            >
              <PlaySessionPanel char={char} onChange={updateChar} compact />
            </PlaySection>

            <PlaySection
              dense
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
              title="Vantagens e desvantagens"
            >
              <PlayAdvantagesPanel
                compact
                selectedAdvantages={displayChar.selectedAdvantages}
                selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
                selectedRace={displayChar.selectedRace}
                selectedClass={displayChar.selectedClass}
              />
            </PlaySection>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Play;

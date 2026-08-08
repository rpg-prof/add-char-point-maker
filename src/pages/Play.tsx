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
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl gilt-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-gold/15 bg-gradient-to-b from-gold/[0.04] to-transparent">
        <h2 className="font-display text-lg tracking-wide text-foreground flex items-center gap-2">
          <span className="text-gold">{icon}</span>
          {title}
        </h2>
        <div className="gold-rule mt-2" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const Play = () => {
  const navigate = useNavigate();
  const [char, setChar] = useState<CharacterSaveData | null>(() => getActiveCharacter());

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
              <h1 className="font-display text-sm leading-tight text-gold tracking-wide truncate">
                AD&amp;D 2.5
              </h1>
              <p className="font-body text-[10px] text-parchment/60 leading-tight">
                Ficha de Personagem
              </p>
            </div>
          </Link>

          <div className="gold-rule flex-1 max-w-[80px] hidden md:block" />
          <h2 className="hidden md:block font-display text-sm tracking-wider text-parchment/80 truncate">
            {displayChar.charName.trim() || "Personagem sem nome"}
            <span className="text-parchment/45 font-body text-xs ml-2">
              Nv. {characterLevel} · {displayChar.selectedRace} · {displayChar.selectedClass}
            </span>
          </h2>
          <div className="flex-1" />

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button
              size="sm"
              asChild
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
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
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePdf}
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
              title="Gerar ficha em PDF"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              className="bg-transparent text-parchment border border-gold/40 hover:bg-gold/15 hover:text-gold font-body text-xs"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              size="sm"
              onClick={handleEvolve}
              className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs font-semibold shadow-[var(--shadow-gold)]"
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

        <PlaySection icon={<Package className="w-4 h-4" />} title="Sessão">
          <PlaySessionPanel char={char} onChange={updateChar} />
        </PlaySection>

        <PlaySection icon={<User className="w-4 h-4" />} title="Atributos">
          <PlayAttributesPanel
            attributes={displayChar.attributes}
            subAttributes={displayChar.subAttributes}
          />
        </PlaySection>

        <PlaySection icon={<Shield className="w-4 h-4" />} title="Armadura">
          <PlayArmorPanel
            attributes={displayChar.attributes}
            subAttributes={displayChar.subAttributes}
            purchasedItems={displayChar.purchasedItems}
            addedItems={displayChar.addedItems}
            selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
            loadout={loadout}
            onLoadoutChange={(combatLoadout) => updateChar({ ...char, combatLoadout })}
          />
        </PlaySection>

        <PlaySection icon={<Swords className="w-4 h-4" />} title="Armas e perícias com armas">
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

        <PlaySection icon={<BookOpen className="w-4 h-4" />} title="Perícias comuns">
          <PlaySkillsPanel
            selectedSkills={displayChar.selectedSkills}
            selectedClass={displayChar.selectedClass}
            skillBonuses={char.evolutionProgress?.skillBonuses}
          />
        </PlaySection>

        <PlaySection icon={<Heart className="w-4 h-4" />} title="Resistências">
          <PlayResistancesPanel
            subAttributes={displayChar.subAttributes}
            selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
            evolutionResistanceBonus={evolutionResistanceBonus}
          />
        </PlaySection>

        <PlaySection icon={<Sparkles className="w-4 h-4" />} title="Poderes">
          <PlayPowersPanel
            selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
            evolutionProgress={char.evolutionProgress}
          />
        </PlaySection>

        <PlaySection icon={<ShieldAlert className="w-4 h-4" />} title="Vantagens e desvantagens">
          <PlayAdvantagesPanel
            selectedAdvantages={displayChar.selectedAdvantages}
            selectedRaceClassAdv={displayChar.selectedRaceClassAdv}
            selectedRace={displayChar.selectedRace}
            selectedClass={displayChar.selectedClass}
          />
        </PlaySection>
      </main>
    </div>
  );
};

export default Play;

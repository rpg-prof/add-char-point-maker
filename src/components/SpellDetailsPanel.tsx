import type { Spell } from "@/data/spells";
import SpellDescription from "@/components/SpellDescription";

export function getSpellMetadataFields(spell: Spell): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [];

  if (spell.range) fields.push({ label: "Alcance", value: spell.range });
  if (spell.duration) fields.push({ label: "Duração", value: spell.duration });
  if (spell.castingTime) fields.push({ label: "Tempo", value: spell.castingTime });
  if (spell.components) fields.push({ label: "Componentes", value: spell.components });
  if (spell.area) fields.push({ label: "Área", value: spell.area });
  if (spell.savingThrow) fields.push({ label: "Resistência", value: spell.savingThrow });
  if (spell.sphere) fields.push({ label: "Esfera", value: spell.sphere });
  if (spell.school) fields.push({ label: "Escola", value: spell.school });
  if (spell.source) fields.push({ label: "Fonte", value: spell.source });

  return fields;
}

interface SpellDetailsPanelProps {
  spell: Spell;
  className?: string;
}

const SpellDetailsPanel = ({ spell, className }: SpellDetailsPanelProps) => {
  const fields = getSpellMetadataFields(spell);

  return (
    <div className={className ?? "mx-2 mb-2 px-3 py-2 text-xs font-body text-muted-foreground bg-card/60 border border-border/50 rounded space-y-2"}>
      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {fields.map(({ label, value }) => (
            <span key={label}>
              <span className="text-foreground font-semibold">{label}:</span> {value}
            </span>
          ))}
        </div>
      )}
      <SpellDescription description={spell.description} />
    </div>
  );
};

export default SpellDetailsPanel;

import { Package, ScrollText } from "lucide-react";

interface NotesPanelProps {
  notesItems: string;
  notesGeneral: string;
  onNotesItemsChange: (value: string) => void;
  onNotesGeneralChange: (value: string) => void;
}

const textareaCls =
  "w-full min-h-[220px] resize-y bg-background/50 border border-border rounded-md px-3 py-2 text-foreground font-body text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold";

const NotesPanel = ({
  notesItems,
  notesGeneral,
  onNotesItemsChange,
  onNotesGeneralChange,
}: NotesPanelProps) => (
  <div className="space-y-6">
    <p className="font-body text-muted-foreground text-sm">
      Registre itens extras, tesouros encontrados e anotações gerais da campanha.
    </p>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm tracking-wider uppercase text-foreground">
            Itens
          </h3>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          Loot, consumíveis, itens mágicos e equipamento não listado na ficha.
        </p>
        <textarea
          value={notesItems}
          onChange={(e) => onNotesItemsChange(e.target.value)}
          placeholder="Ex.: Poção de cura (2), pergaminho de Bola de Fogo, chave de bronze..."
          className={textareaCls}
        />
      </div>
      <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm tracking-wider uppercase text-foreground">
            Geral
          </h3>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          História, contatos, objetivos, lembretes de sessão e outras anotações.
        </p>
        <textarea
          value={notesGeneral}
          onChange={(e) => onNotesGeneralChange(e.target.value)}
          placeholder="Ex.: Deve favor ao guildmaster de Waterdeep. Próximo destino: masmorra de Cragmaw..."
          className={textareaCls}
        />
      </div>
    </div>
  </div>
);

export default NotesPanel;

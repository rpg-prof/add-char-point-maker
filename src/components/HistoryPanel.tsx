import { useState } from "react";
import { BookHeart, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { proseReadingCls } from "@/components/SpellDescription";

interface HistoryPanelProps {
  characterHistory: string;
  onCharacterHistoryChange: (value: string) => void;
}

const textareaCls =
  "w-full min-h-[320px] resize-y bg-background/50 border border-border rounded-md px-3 py-2 text-foreground font-body text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold font-mono";

const HistoryPanel = ({
  characterHistory,
  onCharacterHistoryChange,
}: HistoryPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-3">
      <p className="font-body text-muted-foreground text-xs">
        Conte a origem, passado e marcos importantes do personagem. Suporta{" "}
        <span className="text-foreground/80">Markdown</span>.
      </p>
      <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookHeart className="w-4 h-4 text-gold shrink-0" />
            <h3 className="font-display text-xs tracking-wider uppercase text-foreground">
              Histórico do personagem
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gold-dark/40 bg-gold-dark/10 text-gold-dark font-display text-[10px] tracking-wider uppercase hover:bg-gold-dark/20 transition-colors"
          >
            {isEditing ? (
              <>
                <Eye className="w-3 h-3" />
                Visualizar
              </>
            ) : (
              <>
                <Pencil className="w-3 h-3" />
                Editar
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={characterHistory}
            onChange={(e) => onCharacterHistoryChange(e.target.value)}
            placeholder={`## Origem\n\nNascido em uma aldeia nas montanhas do norte...\n\n## Evento marcante\n\n- Perdeu os pais aos 12 anos\n- Foi criado por um **eremita**`}
            className={textareaCls}
            spellCheck
            autoFocus
          />
        ) : (
          <div className="rounded-md border border-border bg-background/50 px-4 py-3 min-h-[320px]">
            {characterHistory.trim() ? (
              <div className={proseReadingCls}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold underline underline-offset-2 hover:text-gold-dark"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {characterHistory}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="font-body text-sm text-muted-foreground italic">
                Nenhum histórico registrado. Clique em Editar para escrever.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;

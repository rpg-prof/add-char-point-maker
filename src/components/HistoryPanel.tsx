import { BookHeart, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HistoryPanelProps {
  characterHistory: string;
  onCharacterHistoryChange: (value: string) => void;
}

const textareaCls =
  "w-full min-h-[320px] resize-y bg-background/50 border border-border rounded-md px-3 py-2 text-foreground font-body text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold font-mono";

const markdownPreviewCls =
  "prose prose-sm max-w-none min-h-[320px] font-body text-foreground prose-headings:font-display prose-headings:tracking-wide prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-em:text-foreground/90 prose-a:text-gold prose-blockquote:border-gold/40 prose-blockquote:text-muted-foreground prose-li:text-foreground/90 prose-hr:border-border";

const HistoryPanel = ({
  characterHistory,
  onCharacterHistoryChange,
}: HistoryPanelProps) => (
  <div className="space-y-4">
    <p className="font-body text-muted-foreground text-sm">
      Conte a origem, passado e marcos importantes do personagem. Suporta{" "}
      <span className="text-foreground/80">Markdown</span> — títulos, listas, negrito,
      itálico, citações e links.
    </p>
    <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <BookHeart className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm tracking-wider uppercase text-foreground">
          Histórico do personagem
        </h3>
      </div>

      <Tabs defaultValue="write" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex bg-card/60 border border-border">
          <TabsTrigger
            value="write"
            className="font-display text-xs tracking-wider uppercase data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Escrever
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="font-display text-xs tracking-wider uppercase data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Visualizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="mt-3">
          <textarea
            value={characterHistory}
            onChange={(e) => onCharacterHistoryChange(e.target.value)}
            placeholder={`## Origem\n\nNascido em uma aldeia nas montanhas do norte...\n\n## Evento marcante\n\n- Perdeu os pais aos 12 anos\n- Foi criado por um **eremita**`}
            className={textareaCls}
            spellCheck
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-3">
          <div className="rounded-md border border-border bg-background/50 px-4 py-3">
            {characterHistory.trim() ? (
              <div className={markdownPreviewCls}>
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
              <p className="font-body text-sm text-muted-foreground italic min-h-[320px]">
                Nada para visualizar ainda. Escreva o histórico na aba Escrever.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
);

export default HistoryPanel;

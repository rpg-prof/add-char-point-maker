import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const proseInlineCls =
  "prose prose-sm max-w-none font-body text-foreground prose-headings:font-display prose-headings:text-sm prose-headings:tracking-wide prose-headings:text-foreground prose-headings:mt-3 prose-headings:mb-1 prose-p:text-muted-foreground prose-p:my-1.5 prose-strong:text-foreground prose-em:text-foreground/90 prose-a:text-gold prose-li:text-muted-foreground prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-hr:border-border";

/** Prose para leitura longa (modais, previews). */
export const proseReadingCls =
  "prose prose-sm sm:prose-base max-w-none font-body text-foreground leading-relaxed prose-headings:font-display prose-headings:tracking-wide prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2 prose-p:text-foreground/90 prose-p:my-2 prose-p:leading-relaxed prose-strong:text-foreground prose-em:text-foreground/90 prose-a:text-gold-dark prose-a:underline prose-blockquote:border-gold/40 prose-blockquote:text-muted-foreground prose-li:text-foreground/90 prose-li:my-1 prose-ul:my-2 prose-ol:my-2 prose-hr:border-border";

interface SpellDescriptionProps {
  description: string;
  className?: string;
  proseClassName?: string;
}

const SpellDescription = ({
  description,
  className = "pt-1 border-t border-border/50",
  proseClassName = proseInlineCls,
}: SpellDescriptionProps) => {
  const trimmed = description.trim();
  if (!trimmed) return null;

  return (
    <div className={className}>
      <div className={proseClassName}>
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
          {trimmed}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default SpellDescription;

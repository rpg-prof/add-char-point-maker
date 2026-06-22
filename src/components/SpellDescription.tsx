import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const proseCls =
  "prose prose-sm max-w-none font-body text-foreground prose-headings:font-display prose-headings:text-sm prose-headings:tracking-wide prose-headings:text-foreground prose-headings:mt-3 prose-headings:mb-1 prose-p:text-muted-foreground prose-p:my-1.5 prose-strong:text-foreground prose-em:text-foreground/90 prose-a:text-gold prose-li:text-muted-foreground prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-hr:border-border";

interface SpellDescriptionProps {
  description: string;
  className?: string;
}

const SpellDescription = ({
  description,
  className = "pt-1 border-t border-border/50",
}: SpellDescriptionProps) => {
  const trimmed = description.trim();
  if (!trimmed) return null;

  return (
    <div className={className}>
      <div className={proseCls}>
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

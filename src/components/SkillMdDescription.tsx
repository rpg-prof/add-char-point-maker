import { useEffect, useState } from "react";
import SpellDescription, { proseReadingCls } from "@/components/SpellDescription";
import { fetchSkillDescription } from "@/data/skills";

interface SkillMdDescriptionProps {
  mdFile: string;
  className?: string;
  /** `reading` — texto maior e mais contrastado (modais). */
  variant?: "inline" | "reading";
}

/** Converte quebras simples de linha em hard breaks Markdown. */
function preserveLineBreaks(text: string): string {
  if (/^#{1,6}\s|^[-*+]\s/m.test(text)) return text;
  return text.replace(/([^\n])\n(?!\n)/g, "$1  \n");
}

const SkillMdDescription = ({
  mdFile,
  className,
  variant = "inline",
}: SkillMdDescriptionProps) => {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setText(null);
    fetchSkillDescription(mdFile).then((content) => {
      if (!cancelled) setText(content);
    });
    return () => {
      cancelled = true;
    };
  }, [mdFile]);

  if (text === null) {
    return (
      <p className="font-body text-sm text-muted-foreground italic">Carregando…</p>
    );
  }

  if (!text.trim()) return null;

  return (
    <SpellDescription
      description={preserveLineBreaks(text)}
      className={className ?? "border-0 pt-0"}
      proseClassName={variant === "reading" ? proseReadingCls : undefined}
    />
  );
};

export default SkillMdDescription;

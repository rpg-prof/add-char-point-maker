interface AdvantageDescriptionProps {
  description: string;
  link?: string;
  className?: string;
}

const AdvantageDescription = ({
  description,
  link,
  className = "pt-1 border-t border-border/50",
}: AdvantageDescriptionProps) => (
  <p className={className}>
    {description.split(/(https?:\/\/\S+)/g).map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gold underline break-all"
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    )}
    {link && (
      <>
        {" "}
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gold underline"
        >
          Detalhes
        </a>
      </>
    )}
  </p>
);

export default AdvantageDescription;

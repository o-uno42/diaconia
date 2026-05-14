interface HighlightProps {
  text: string;
  keywords: string[];
  className?: string;
}

export default function Highlight({ text, keywords, className = '' }: HighlightProps) {
  if (!keywords.length || !text) {
    return <span className={className}>{text}</span>;
  }

  // Build regex from keywords (case-insensitive)
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-yellow-400/30 text-stone-800 px-0.5 rounded font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

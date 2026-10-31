import katex from 'katex';

export default function MathText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return (
    <span className={`math-text ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const display = part.startsWith('$$');
          const expression = part.slice(display ? 2 : 1, display ? -2 : -1);
          return (
            <span
              key={i}
              className={display ? 'math-display' : 'math-inline'}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(expression, {
                  throwOnError: false,
                  displayMode: display,
                  trust: false,
                  strict: 'ignore',
                  maxExpand: 500,
                  maxSize: 10,
                  output: 'htmlAndMathml',
                }),
              }}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

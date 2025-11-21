import ReactMarkdown from 'react-markdown';

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        h1: ({ children }) => <h1 className="text-xl font-semibold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
        code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
        pre: ({ children }) => <pre className="bg-muted p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

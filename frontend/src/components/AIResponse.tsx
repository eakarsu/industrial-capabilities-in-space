import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props { content: string; loading?: boolean; timestamp?: string; }

function formatContent(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.match(/^\*\*.+\*\*/)) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return <p key={i} className="text-gray-200 mb-1">{parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-white">{p.slice(2,-2)}</strong> : p)}</p>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-gray-200 ml-4 mb-1 list-disc">{line.slice(2)}</li>;
    if (line.match(/^\d+\./)) return <p key={i} className="text-gray-200 mb-1">{line}</p>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-gray-200 mb-1">{line}</p>;
  });
}

export default function AIResponse({ content, loading, timestamp }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  if (loading) return (
    <div className="rounded-xl bg-gradient-to-br from-violet-900 to-indigo-900 border border-violet-700 p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-violet-300" /><span className="text-violet-300 text-sm">AI analyzing...</span></div>
      <div className="space-y-2">{[3,4,5,3].map((w,i) => <div key={i} className={`h-3 bg-violet-700 rounded w-${w}/4`} />)}</div>
    </div>
  );
  if (!content) return null;
  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-900 to-indigo-900 border border-violet-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /><span className="text-violet-300 text-sm font-medium">AI Analysis</span></div>
        <div className="flex items-center gap-3">
          {timestamp && <span className="text-violet-400 text-xs">{timestamp}</span>}
          <button onClick={copy} className="text-violet-400 hover:text-white transition-colors">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
        </div>
      </div>
      <div className="text-sm leading-relaxed">{formatContent(content)}</div>
    </div>
  );
}

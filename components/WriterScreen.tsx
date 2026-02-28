
import React, { useState, useEffect, useRef } from 'react';
import { SegmentLength, SegmentType, StorySegment, StoryState } from '../types';
import { 
  PenTool, 
  Feather, 
  Loader2, 
  Download, 
  CheckCircle2, 
  Copy
} from 'lucide-react';
import { writeStorySegment } from '../services/geminiService';

interface WriterScreenProps {
  storyState: StoryState;
  onUpdateSegments: (segments: StorySegment[]) => void;
}

const WriterScreen: React.FC<WriterScreenProps> = ({ storyState, onUpdateSegments }) => {
  const [startWith, setStartWith] = useState('');
  const [endWith, setEndWith] = useState('');
  const [segmentType, setSegmentType] = useState<SegmentType>(SegmentType.START);
  const [length, setLength] = useState<SegmentLength>(SegmentLength.MEDIUM);
  const [isWriting, setIsWriting] = useState(false);
  const [writingStatus, setWritingStatus] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyState.segments]);

  const handleWrite = async () => {
    setIsWriting(true);
    setWritingStatus('Pondo as ideias no papel...');
    try {
      const newText = await writeStorySegment(
        storyState.title,
        storyState.genre,
        storyState.lore,
        storyState.segments,
        { startWith, endWith, type: segmentType, length }
      );

      const newSegment: StorySegment = {
        id: Date.now().toString(),
        text: newText,
        type: segmentType
      };

      onUpdateSegments([...storyState.segments, newSegment]);
      setStartWith('');
      setEndWith('');
      if (segmentType === SegmentType.START) setSegmentType(SegmentType.MIDDLE);
    } catch (e) {
      alert("Erro ao gerar o segmento literário.");
    } finally {
      setIsWriting(false);
      setWritingStatus('');
    }
  };

  const downloadFullManuscript = () => {
    const filename = storyState.title.substring(0, 32).trim().replace(/\s+/g, '_') || 'manuscrito';
    const fullText = storyState.segments.map((s, idx) => `${idx + 1}\n${s.text}`).join('\n\n\n');
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    link.click();
  };

  const isStoryComplete = storyState.segments.some(s => s.type === SegmentType.END);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-paper">
      {/* Header Minimalista */}
      <header className="flex-none bg-white border-b border-stone-200 p-4 flex justify-between items-center shadow-sm z-50">
        <div className="flex items-center gap-3 truncate">
            <div className="bg-indigo-100 p-2 rounded-lg">
                <Feather className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-serif font-bold text-ink-900 truncate">
                {storyState.title}
            </h1>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={() => {
                    const fullText = storyState.segments.map(s => s.text).join('\n\n');
                    navigator.clipboard.writeText(fullText);
                    alert("Copiado!");
                }}
                className="flex items-center gap-2 text-sm bg-stone-50 hover:bg-stone-100 px-4 py-2 rounded-lg border border-stone-200 font-medium transition-colors"
            >
                <Copy className="w-4 h-4" />
                <span>Copiar Obra</span>
            </button>
            
            {storyState.segments.length > 0 && (
              <button onClick={downloadFullManuscript} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all">
                  <Download className="w-4 h-4" /> 
                  <span>Exportar TXT</span>
              </button>
            )}
        </div>
      </header>

      {/* Fluxo de Prosa */}
      <div className="flex-grow overflow-y-auto p-4 md:p-12 space-y-12 pb-32">
        <div className="max-w-3xl mx-auto space-y-16">
          <div className="text-center space-y-4 pt-12">
            <h1 className="text-6xl font-serif font-bold text-ink-900 leading-tight">{storyState.title}</h1>
            <p className="text-stone-400 font-serif italic text-xl uppercase tracking-widest">{storyState.genre}</p>
          </div>

          {storyState.segments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300 space-y-4">
              <Feather className="w-16 h-16 opacity-10" />
              <p className="font-serif italic text-xl">Inicie sua narrativa épica...</p>
            </div>
          )}

          {storyState.segments.map((segment, index) => (
            <div key={segment.id} className="animate-fade-in group">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-grow bg-stone-200"></div>
                <span className="text-stone-300 font-serif italic text-sm">Capítulo {index + 1}</span>
                <div className="h-px flex-grow bg-stone-200"></div>
              </div>

              <div className="prose prose-stone prose-xl max-w-none font-serif text-ink-800 leading-relaxed whitespace-pre-wrap">
                {segment.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Painel de Controle de Escrita */}
      <div className="border-t border-stone-200 bg-white/95 backdrop-blur-xl p-4 md:p-6 z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end gap-4">
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Início Obrigatório</label>
              <input
                type="text"
                value={startWith}
                onChange={(e) => setStartWith(e.target.value)}
                placeholder="Frase inicial..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Fim Obrigatório</label>
              <input
                type="text"
                value={endWith}
                onChange={(e) => setEndWith(e.target.value)}
                placeholder="Frase final..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
             <select 
               value={segmentType} 
               onChange={(e) => setSegmentType(e.target.value as SegmentType)}
               className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
             >
               <option value={SegmentType.START}>Início</option>
               <option value={SegmentType.MIDDLE}>Desenvolvimento</option>
               <option value={SegmentType.END}>Clímax/Final</option>
             </select>

             <select 
               value={length} 
               onChange={(e) => setLength(e.target.value as SegmentLength)}
               className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
             >
               <option value={SegmentLength.SHORT}>Curto</option>
               <option value={SegmentLength.MEDIUM}>Médio</option>
               <option value={SegmentLength.LONG}>Longo</option>
               <option value={SegmentLength.GIGANTIC}>Extenso</option>
             </select>
          </div>

          <button
            onClick={handleWrite}
            disabled={isWriting || isStoryComplete}
            className={`flex-grow md:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
              isStoryComplete 
              ? 'bg-emerald-500 text-white' 
              : 'bg-indigo-900 hover:bg-indigo-950 text-white'
            }`}
          >
            {isWriting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">{writingStatus}</span>
              </>
            ) : isStoryComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Obra Concluída</span>
              </>
            ) : (
              <>
                <PenTool className="w-5 h-5" />
                <span>Escrever Segmento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriterScreen;

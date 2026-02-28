
import React, { useState } from 'react';
import { Genre, Screen } from '../types';
import { Sparkles, PenTool, Wand2, Loader2 } from 'lucide-react';
import { generateRandomTitle } from '../services/geminiService';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onUpdateStoryData: (title: string, genre: Genre) => void;
  onQuickGenerate: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onUpdateStoryData, onQuickGenerate }) => {
  const [title, setTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre>(Genre.FANTASY);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const handleManual = () => {
    if (!title.trim()) {
      alert("Por favor, insira um título primeiro!");
      return;
    }
    onUpdateStoryData(title, selectedGenre);
    onNavigate(Screen.LORE);
  };

  const handleQuick = () => {
    if (!title.trim()) {
      alert("Por favor, insira um título primeiro!");
      return;
    }
    onUpdateStoryData(title, selectedGenre);
    onQuickGenerate();
  };

  const handleGenerateTitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const newTitle = await generateRandomTitle(selectedGenre);
      setTitle(newTitle);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-ink-900 tracking-tight">
          Story-o-matic
        </h1>
        <p className="text-lg text-ink-800/70 font-serif italic">
          Focado na arte da narrativa pura.
        </p>
      </div>

      <div className="w-full max-w-xl space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-stone-200">
        <div className="space-y-2 text-left">
          <label className="text-sm font-semibold uppercase tracking-wider text-ink-800/60">Título da História</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="As Crônicas de..."
              className="flex-grow text-2xl font-serif font-bold border-b-2 border-stone-200 focus:border-indigo-600 outline-none py-2 bg-transparent placeholder-stone-300 transition-colors"
            />
            <button
              onClick={handleGenerateTitle}
              disabled={isGeneratingTitle}
              title="Gerar título aleatório"
              className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all active:scale-90 disabled:opacity-50"
            >
              {isGeneratingTitle ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-sm font-semibold uppercase tracking-wider text-ink-800/60">Selecione o Gênero / Estilo</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(Genre).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`p-2 text-xs sm:text-sm rounded-lg transition-all border ${
                  selectedGenre === g
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <button
            onClick={handleQuick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white py-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl group"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 group-hover:animate-pulse" />
            <span>Escrever Baseado no Estilo</span>
          </button>
          
          <button
            onClick={handleManual}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-ink-900 border-2 border-stone-200 py-3 rounded-xl font-medium transition-colors"
          >
            <PenTool className="w-4 h-4" />
            <span>Definir Bíblia Manualmente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;


import React, { useState } from 'react';
import { Genre, LoreData, Screen, StorySegment, StoryState } from './types';
import HomeScreen from './components/HomeScreen';
import LoreScreen from './components/LoreScreen';
import WriterScreen from './components/WriterScreen';
import { generateLoreDetails } from './services/geminiService';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  const [story, setStory] = useState<StoryState>({
    title: '',
    genre: Genre.FANTASY,
    lore: {
      characters: '',
      world: '',
      extraInfo: ''
    },
    segments: []
  });

  const handleUpdateStoryData = (title: string, genre: Genre) => {
    setStory(prev => ({ ...prev, title, genre }));
  };

  const handleUpdateLore = (lore: LoreData) => {
    setStory(prev => ({ ...prev, lore }));
  };

  const handleUpdateSegments = (segments: StorySegment[]) => {
    setStory(prev => ({ ...prev, segments }));
  };

  const handleAutoFillLoreAndProceed = async (currentLore: LoreData = story.lore) => {
    setLoading(true);
    setLoadingStatus('Estabelecendo as fundações da sua história...');
    try {
      let finalLore = { ...currentLore };
      
      const isLoreIncomplete = !currentLore.characters?.trim() || 
                               !currentLore.world?.trim() || 
                               !currentLore.extraInfo?.trim();

      if (isLoreIncomplete) {
         setLoadingStatus('Expandindo a bíblia do mundo...');
         const details = await generateLoreDetails(story.title, story.genre, currentLore);
         finalLore = { ...finalLore, ...details };
      }

      setStory(prev => ({ ...prev, lore: finalLore }));
      setCurrentScreen(Screen.WRITER);
    } catch (error) {
      console.error(error);
      alert("Erro ao processar a bíblia da história. Verifique sua chave API.");
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleQuickGenerate = async () => {
     await handleAutoFillLoreAndProceed(story.lore);
  };

  return (
    <div className="font-sans text-ink-900 bg-paper min-h-screen selection:bg-indigo-100">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-paper/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl animate-pulse rounded-full"></div>
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin relative"></div>
           </div>
           <h2 className="text-2xl font-serif font-bold text-ink-900 mb-2">{loadingStatus}</h2>
        </div>
      )}

      {currentScreen === Screen.HOME && (
        <HomeScreen 
          onNavigate={setCurrentScreen}
          onUpdateStoryData={handleUpdateStoryData}
          onQuickGenerate={handleQuickGenerate}
        />
      )}

      {currentScreen === Screen.LORE && (
        <LoreScreen 
          title={story.title}
          genre={story.genre}
          lore={story.lore}
          onUpdateLore={handleUpdateLore}
          onNavigate={setCurrentScreen}
          onAutoFillAndProceed={handleAutoFillLoreAndProceed}
          isGenerating={loading}
        />
      )}

      {currentScreen === Screen.WRITER && (
        <WriterScreen 
          storyState={story}
          onUpdateSegments={handleUpdateSegments}
        />
      )}
    </div>
  );
};

export default App;


import React, { useState, useRef, useEffect } from 'react';
import { Genre, LoreData, Screen } from '../types';
import { ArrowRight, Sparkles, Loader2, FileText, Download, Upload, Trash2, CheckCircle2, X, BookOpen } from 'lucide-react';
import { analyzeReferenceDocument } from '../services/geminiService';

declare const pdfjsLib: any;
declare const mammoth: any;

interface LoreScreenProps {
  title: string;
  genre: Genre;
  lore: LoreData;
  onUpdateLore: (lore: LoreData) => void;
  onNavigate: (screen: Screen) => void;
  onAutoFillAndProceed: (currentLore: LoreData) => Promise<void>;
  isGenerating: boolean;
}

const LoreScreen: React.FC<LoreScreenProps> = ({ 
  title, 
  genre, 
  lore, 
  onUpdateLore, 
  onNavigate, 
  onAutoFillAndProceed, 
  isGenerating 
}) => {
  const [localLore, setLocalLore] = useState<LoreData>(lore);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalLore(lore);
  }, [lore]);

  const handleChange = (field: keyof LoreData, value: string) => {
    const updated = { ...localLore, [field]: value };
    setLocalLore(updated);
    onUpdateLore(updated);
  };

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    setAnalysisStatus('Analisando estrutura do PDF...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      setAnalysisStatus(`Extraindo página ${i} de ${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    setAnalysisStatus('Processando documento Word...');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleReferenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisStatus(`Lendo arquivo: ${file.name}...`);

    try {
      let extractedText = '';
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'pdf') {
        const buffer = await file.arrayBuffer();
        extractedText = await extractTextFromPdf(buffer);
      } else if (extension === 'docx') {
        const buffer = await file.arrayBuffer();
        extractedText = await extractTextFromDocx(buffer);
      } else {
        extractedText = await file.text();
      }

      if (!extractedText.trim()) throw new Error("O documento parece estar vazio.");

      setAnalysisStatus('A IA está destilando a Bíblia da História no idioma original...');
      const extractedLore = await analyzeReferenceDocument(extractedText, title, genre);
      
      const mergedLore = {
        characters: (localLore.characters ? localLore.characters + "\n\n--- EXTRAÍDO DO DOCUMENTO ---\n" : "") + extractedLore.characters,
        world: (localLore.world ? localLore.world + "\n\n--- EXTRAÍDO DO DOCUMENTO ---\n" : "") + extractedLore.world,
        extraInfo: (localLore.extraInfo ? localLore.extraInfo + "\n\n--- EXTRAÍDO DO DOCUMENTO ---\n" : "") + extractedLore.extraInfo,
      };
      
      setLocalLore(mergedLore);
      onUpdateLore(mergedLore);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 6000);
    } catch (error: any) {
      alert(`Erro: ${error.message || "Falha ao processar o documento."}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
      if (referenceInputRef.current) referenceInputRef.current.value = "";
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(localLore, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_bible.json`);
    linkElement.click();
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        onUpdateLore(json);
      } catch (err) { alert("Arquivo JSON inválido."); }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = "";
  };

  if (isGenerating || isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-6 bg-paper text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/10 blur-3xl animate-pulse rounded-full"></div>
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold text-ink-900 tracking-tight">
            {analysisStatus || "Estabelecendo Continuidade..."}
          </h2>
          <p className="text-stone-500 italic max-w-sm mx-auto">
            Grandes histórias exigem uma base sólida. Estamos construindo a sua agora no idioma original do documento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-10 animate-fade-in pb-40">
      <input type="file" accept=".txt,.md,.pdf,.docx" ref={referenceInputRef} onChange={handleReferenceUpload} className="hidden" />
      <input type="file" accept=".json" ref={jsonInputRef} onChange={handleImportJson} className="hidden" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-300 pb-8 gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-serif font-bold text-ink-900">Bíblia da História</h1>
          <div className="flex items-center gap-3 text-stone-500">
            <BookOpen className="w-5 h-5" />
            <p className="font-serif italic text-lg">
              Projeto: <span className="text-indigo-800 font-bold not-italic">{title}</span> &bull; {genre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate(Screen.HOME)} 
            className="px-4 py-2 text-sm font-bold text-stone-400 hover:text-ink-900 transition-colors uppercase tracking-widest"
          >
            Voltar
          </button>
          <button 
            onClick={() => referenceInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span>Carregar Referência</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-emerald-900 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div>
              <p className="font-bold">Informações extraídas com sucesso!</p>
              <p className="text-sm opacity-80">Você pode revisar e editar os detalhes nos campos abaixo antes de prosseguir.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccess(false)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Utility Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
        <button onClick={() => jsonInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-indigo-600 transition-all">
          <Upload className="w-4 h-4" /> Importar Lore
        </button>
        <button onClick={handleExportJson} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-indigo-600 transition-all">
          <Download className="w-4 h-4" /> Exportar Lore
        </button>
        <button 
          onClick={() => { if(confirm("Limpar todos os campos de lore?")) onUpdateLore({characters:'', world:'', extraInfo:''}) }} 
          className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Limpar Bíblia
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {[
          { 
            id: 'characters', 
            label: 'Elenco de Personagens', 
            placeholder: 'Quem vive no seu mundo? Descreva aparências, vozes e motivações...', 
            value: localLore.characters 
          },
          { 
            id: 'world', 
            label: 'Construção de Mundo', 
            placeholder: 'Geografia, ordem social, atmosfera atual e as leis da realidade...', 
            value: localLore.world 
          },
          { 
            id: 'extraInfo', 
            label: 'Sistemas e Segredos', 
            placeholder: 'Sistemas de magia/tecnologia, profecias ocultas, história e notas de estilo...', 
            value: localLore.extraInfo 
          },
        ].map((section) => (
          <div key={section.id} className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden flex flex-col group transition-all hover:border-indigo-200">
            <div className="px-8 py-5 bg-stone-50/50 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-ink-900">{section.label}</h3>
              <button 
                onClick={() => handleChange(section.id as keyof LoreData, '')}
                className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Limpar Seção"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <textarea
              className="w-full h-64 p-8 outline-none focus:bg-indigo-50/10 transition-colors font-serif leading-relaxed text-xl text-ink-800 placeholder-stone-200 resize-none"
              placeholder={section.placeholder}
              value={section.value}
              onChange={(e) => handleChange(section.id as keyof LoreData, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-paper via-paper to-transparent pointer-events-none z-40">
        <div className="max-w-5xl mx-auto flex justify-end pointer-events-auto">
          <button
            onClick={() => onAutoFillAndProceed(localLore)}
            className="group flex items-center gap-4 bg-indigo-900 hover:bg-indigo-950 text-white px-10 py-5 rounded-full font-bold text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <span>Iniciar Escrita</span>
            {(!localLore.characters || !localLore.world) 
              ? <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" /> 
              : <ArrowRight className="w-7 h-7" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoreScreen;

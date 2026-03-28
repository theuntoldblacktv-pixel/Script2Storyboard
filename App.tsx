
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatBot from './components/ChatBot';
import { GeminiService } from './services/geminiService';
import { Scene, AspectRatio } from './types';

const App: React.FC = () => {
  const [scriptText, setScriptText] = useState('');
  const [inputMode, setInputMode] = useState<'script' | 'manual'>('script');
  const [manualPrompts, setManualPrompts] = useState('');
  const [sceneCount, setSceneCount] = useState<string | number>('auto');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [theme, setTheme] = useState('Cinematic');
  const [globalInstruction, setGlobalInstruction] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseManualPrompts = (text: string): Scene[] => {
    let blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);
    
    if (blocks.length === 1) {
      const lines = blocks[0].split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 1) {
         blocks = lines;
      }
    }

    return blocks.map((block, i) => {
      const cleanPrompt = block.replace(/^\d+[\.\)]\s*/, '');
      return {
        id: `manual-${Date.now()}-${i}`,
        title: `Scene ${i + 1}`,
        description: 'Manual prompt',
        visualPrompt: cleanPrompt,
        status: 'pending' as const
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setScriptText(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const analyzeAndGenerate = async () => {
    setIsAnalyzing(true);
    setError(null);
    let initialScenes: Scene[] = [];
    
    if (inputMode === 'script') {
      if (!scriptText.trim()) {
        setIsAnalyzing(false);
        return;
      }
      try {
        const analysis = await GeminiService.analyzeScript(scriptText, sceneCount, globalInstruction);
        initialScenes = analysis.scenes.map(s => ({ ...s, status: 'pending' as const }));
      } catch (err) {
        setError("Failed to analyze script. Please try again.");
        setIsAnalyzing(false);
        return;
      }
    } else {
      if (!manualPrompts.trim()) {
        setIsAnalyzing(false);
        return;
      }
      initialScenes = parseManualPrompts(manualPrompts);
    }
    
    setScenes(initialScenes);
    setIsAnalyzing(false);
    setIsGenerating(true);
    
    for (let i = 0; i < initialScenes.length; i++) {
      try {
        setScenes(prev => {
          const s = [...prev];
          s[i] = { ...s[i], status: 'generating' };
          return s;
        });

        const imageUrl = await GeminiService.generateStoryboardImage(
          initialScenes[i].visualPrompt,
          aspectRatio,
          theme,
          globalInstruction
        );
        
        setScenes(prev => {
          const s = [...prev];
          s[i] = { ...s[i], status: 'completed', imageUrl };
          return s;
        });
      } catch (err: any) {
        console.error("Image generation error:", err);
        setError(`Failed to generate image for scene ${i + 1}: ${err.message}`);
        setScenes(prev => {
          const s = [...prev];
          s[i] = { ...s[i], status: 'error' };
          return s;
        });
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12 pb-32">
        <div className="mb-12 text-center">
          <h2 className="text-5xl md:text-6xl font-serif mb-4 text-white">Bring your script to life.</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Upload your screenplay or treatment. We'll decompose it into scenes and generate cinematic storyboard frames automatically.
          </p>
        </div>

        {/* Action Controls */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 mb-12 shadow-xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column: Input */}
            <div className="space-y-6">
              <div className="flex gap-4 border-b border-white/10 pb-4">
                <button 
                  onClick={() => setInputMode('script')}
                  className={`pb-2 text-lg font-bold transition-colors relative ${inputMode === 'script' ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Script Analysis
                  {inputMode === 'script' && <div className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-purple-500" />}
                </button>
                <button 
                  onClick={() => setInputMode('manual')}
                  className={`pb-2 text-lg font-bold transition-colors relative ${inputMode === 'manual' ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Bulk Prompts
                  {inputMode === 'manual' && <div className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-purple-500" />}
                </button>
              </div>

              {inputMode === 'script' ? (
                <div className="space-y-4 animate-fade-in">
                  <label className="block text-sm font-medium text-zinc-300">Your Script</label>
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Paste your script here or upload a file..."
                    className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono resize-none"
                  />
                  <div className="relative w-48">
                    <input
                      type="file"
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white rounded-xl py-3 hover:bg-white/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Upload File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <label className="block text-sm font-medium text-zinc-300">Manual Prompts</label>
                  <p className="text-xs text-zinc-500">Enter one prompt per line, or separate multiple prompts with a blank line. You can use numbers (1. 2.) if you prefer.</p>
                  <textarea
                    value={manualPrompts}
                    onChange={(e) => setManualPrompts(e.target.value)}
                    placeholder="1. A wide shot of a futuristic city at night...&#10;2. Close up of a detective looking at a glowing clue..."
                    className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono resize-none"
                  />
                </div>
              )}
            </div>

            {/* Right Column: Settings */}
            <div className="space-y-6 flex flex-col">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4">Generation Settings</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-300">Aspect Ratio</label>
                  <select 
                    value={aspectRatio} 
                    onChange={e => setAspectRatio(e.target.value as AspectRatio)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="16:9">16:9 (Widescreen)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3 (Standard)</option>
                    <option value="3:4">3:4 (Portrait)</option>
                  </select>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-300">Visual Theme</label>
                  <select 
                    value={theme} 
                    onChange={e => setTheme(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Cinematic">Cinematic</option>
                    <option value="Anime">Anime</option>
                    <option value="Comic Book">Comic Book</option>
                    <option value="Watercolor">Watercolor</option>
                    <option value="Cyberpunk">Cyberpunk</option>
                    <option value="Photorealistic">Photorealistic</option>
                    <option value="Concept Art">Concept Art</option>
                  </select>
                </div>

                {/* Scene Count (Only for Script) */}
                {inputMode === 'script' && (
                  <div className="space-y-3 col-span-2">
                    <label className="block text-sm font-medium text-zinc-300">Number of Scenes</label>
                    <select 
                      value={sceneCount} 
                      onChange={e => setSceneCount(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="auto">Auto (Let AI decide)</option>
                      <option value="5">5 Scenes</option>
                      <option value="10">10 Scenes</option>
                      <option value="15">15 Scenes</option>
                      <option value="20">20 Scenes</option>
                    </select>
                  </div>
                )}

                {/* Global Instructions */}
                <div className="space-y-3 col-span-2">
                  <label className="block text-sm font-medium text-zinc-300">Global Instructions (Optional)</label>
                  <input 
                    type="text"
                    value={globalInstruction}
                    onChange={e => setGlobalInstruction(e.target.value)}
                    placeholder="e.g., 1920s noir, dark lighting, neon accents..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button
                  onClick={analyzeAndGenerate}
                  disabled={isAnalyzing || isGenerating || (inputMode === 'script' ? !scriptText.trim() : !manualPrompts.trim())}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center gap-3"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {inputMode === 'script' ? 'Analyzing Script...' : 'Processing Prompts...'}
                    </>
                  ) : isGenerating ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Images...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {inputMode === 'script' ? 'Analyze & Generate Storyboard' : 'Generate Storyboard'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Scene Sequence */}
        <div className="space-y-12">
          {scenes.map((scene, idx) => (
            <div key={scene.id} className="group grid md:grid-cols-12 gap-8 items-start animate-fade-in">
              <div className="md:col-span-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-purple-400 border border-white/10 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  {idx + 1}
                </div>
                <div className="w-px h-full bg-zinc-800 mt-4 hidden md:block" />
              </div>
              
              <div className="md:col-span-4 space-y-4">
                <h3 className="text-2xl font-semibold text-white">{scene.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{scene.description}</p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">AI Visual Prompt</h4>
                  <p className="text-xs text-zinc-400 italic">"{scene.visualPrompt}"</p>
                </div>
              </div>

              <div className="md:col-span-7 aspect-video relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
                {scene.imageUrl ? (
                  <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                    {scene.status === 'generating' ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        <span className="text-sm font-medium animate-pulse text-purple-400">Capturing cinematic frame...</span>
                      </div>
                    ) : scene.status === 'error' ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs uppercase tracking-widest text-red-500/50">Generation Failed</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs uppercase tracking-widest opacity-20">Awaiting Generation</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  Frame {idx + 1}
                </div>
              </div>
            </div>
          ))}
          
          {scenes.length === 0 && !isAnalyzing && (
            <div className="py-32 flex flex-col items-center justify-center text-zinc-600 space-y-4">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm tracking-wide uppercase font-medium">No script analyzed yet</p>
            </div>
          )}
        </div>
      </main>

      <ChatBot />

      <footer className="border-t border-white/5 py-12 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Script2Storyboard AI. Built with Google Gemini.</p>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;

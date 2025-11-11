
import React, { useState, useCallback, useRef } from 'react';
import { InkCanvas } from './components/InkCanvas';
import { Loader } from './components/Loader';
import { generateArtDescription } from './services/geminiService';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [artDescription, setArtDescription] = useState<{ title: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleGenerateClick = useCallback(() => {
    setShowWelcome(false);
    setArtDescription(null);
    setError(null);
    setIsGeneratingArt(true);
    setAnimationTrigger(prev => prev + 1);
  }, []);

  const handleGenerationComplete = useCallback(async (imageDataUrl: string) => {
    setIsGeneratingArt(false);
    setIsLoading(true);
    try {
      const base64Data = imageDataUrl.split(',')[1];
      // Fix: Directly use the structured JSON response from the service.
      const result = await generateArtDescription(base64Data);
      setArtDescription(result);
    } catch (e) {
      console.error(e);
      setError('無法生成描述。請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const IconPen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#F3F2EE] flex flex-col items-center justify-center font-serif text-gray-800 p-4">
      <header className="absolute top-0 left-0 w-full p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-700 tracking-wider">水墨意境</h1>
        <p className="text-sm md:text-md text-gray-500">墨滴入水，化為萬象</p>
      </header>

      <main className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
        <div className="absolute inset-0 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
          <InkCanvas
            startAnimationTrigger={animationTrigger}
            onGenerationComplete={handleGenerationComplete}
            onAnimationStart={() => setIsGeneratingArt(true)}
          />
          {showWelcome && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 p-8 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">墨與水之舞</h2>
                  <p className="text-gray-600 md:text-lg">點擊按鈕，觀看墨水在水中綻放，生成獨一無二的畫作與詩意描述。</p>
              </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-2xl mt-6 space-y-4">
        <div className="min-h-[6rem] bg-white bg-opacity-50 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200 flex items-center justify-center text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
                <Loader />
                <p className="text-gray-600 mt-2">正在生成詩文...</p>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : artDescription ? (
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold text-gray-800">{artDescription.title}</h3>
              <p className="text-gray-600 mt-1">{artDescription.description}</p>
            </div>
          ) : isGeneratingArt ? (
            <p className="text-gray-600">墨色流動中...</p>
          ) : (
             <p className="text-gray-500">按下「落墨」以開始創作</p>
          )}
        </div>
        
        <button
          onClick={handleGenerateClick}
          disabled={isGeneratingArt || isLoading}
          className="w-full flex items-center justify-center bg-gray-800 text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-md hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <IconPen />
          {isGeneratingArt || isLoading ? '生成中...' : '落墨'}
        </button>
      </footer>
    </div>
  );
};

export default App;

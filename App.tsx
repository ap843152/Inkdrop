
import React, { useState, useCallback } from 'react';
import { Loader } from './components/Loader';
import { generateInkImage, generateArtDescription } from './services/geminiService';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [artDescription, setArtDescription] = useState<{ title: string; description: string } | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [userInput, setUserInput] = useState('');

  const handleGenerateClick = useCallback(async () => {
    if (!userInput.trim()) {
      setError('請輸入您想創作的意象。');
      return;
    }
    setShowWelcome(false);
    setArtDescription(null);
    setGeneratedImageUrl(null);
    setError(null);
    setIsLoading(true);

    try {
      // First, generate the image from the user's prompt
      const imageBase64 = await generateInkImage(userInput);
      setGeneratedImageUrl(`data:image/png;base64,${imageBase64}`);

      // Then, generate the description for the newly created image
      const result = await generateArtDescription(imageBase64, userInput);
      setArtDescription(result);
    } catch (e) {
      console.error(e);
      setError('無法生成藝術作品。請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  }, [userInput]);

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
        <div className="absolute inset-0 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
          {isLoading && !generatedImageUrl && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <Loader />
              <p className="text-gray-600 mt-4 text-lg">正在揮灑筆墨，請稍候...</p>
              <p className="text-gray-500 text-sm">高品質畫作生成需要一些時間</p>
            </div>
          )}
          {generatedImageUrl && (
            <img src={generatedImageUrl} alt={artDescription?.title || 'Generated ink art'} className="w-full h-full object-contain animate-fade-in" />
          )}
          {showWelcome && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">墨蘊萬象</h2>
              <p className="text-gray-600 md:text-lg">輸入一個詞語，觀看它化為一幅具象的水墨藝術畫。</p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-2xl mt-6 space-y-4">
        <div className="min-h-[6rem] bg-white bg-opacity-50 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200 flex items-center justify-center text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader />
              <p className="text-gray-600 mt-2">
                {generatedImageUrl ? '正在生成詩文...' : '畫作生成中...'}
              </p>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : artDescription ? (
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold text-gray-800">{artDescription.title}</h3>
              <p className="text-gray-600 mt-1">{artDescription.description}</p>
            </div>
          ) : (
            <p className="text-gray-500">輸入意象，按下「落墨」以開始創作</p>
          )}
        </div>
        
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="嘗試輸入名詞，如：龍、鹿、鳳凰..."
          className="w-full bg-white bg-opacity-50 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 disabled:opacity-50"
          disabled={isLoading}
        />

        <button
          onClick={handleGenerateClick}
          disabled={isLoading || !userInput.trim()}
          className="w-full flex items-center justify-center bg-gray-800 text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-md hover:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <IconPen />
          {isLoading ? '生成中...' : '落墨'}
        </button>
      </footer>
    </div>
  );
};

export default App;

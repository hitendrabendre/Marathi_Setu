
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiService } from './services/geminiService';
import { ProcessingResult } from './types';
import VoiceInput from './components/VoiceInput';
import AudioVisualizer from './components/AudioVisualizer';
import Logo from './components/Logo';
import { decode, decodeAudioData, audioBufferToWav } from './utils/audioUtils';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Audio State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    
    initAudio();
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setAudioBuffer(null);
    setDownloadUrl(null);
    stopAudio();

    try {
      // 1. Translation and Explanation
      const processingResult = await gemini.translateAndExplain(inputText);
      setResult(processingResult);

      // 2. TTS Generation for the Explanation
      const base64Audio = await gemini.textToSpeech(processingResult.marathiExplanation);
      const audioBytes = decode(base64Audio);
      
      if (audioContextRef.current) {
        const decodedBuffer = await decodeAudioData(
          audioBytes,
          audioContextRef.current,
          24000,
          1
        );
        setAudioBuffer(decodedBuffer);
        
        // Prepare download
        const wavBlob = audioBufferToWav(decodedBuffer);
        const url = URL.createObjectURL(wavBlob);
        setDownloadUrl(url);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = useCallback(() => {
    if (!audioBuffer || !audioContextRef.current) return;

    // Stop current if playing
    stopAudio();

    const context = audioContextRef.current;
    const source = context.createBufferSource();
    const analyser = context.createAnalyser();
    
    source.buffer = audioBuffer;
    analyser.fftSize = 256;
    
    source.connect(analyser);
    analyser.connect(context.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };

    analyserNodeRef.current = analyser;
    sourceNodeRef.current = source;
    
    startTimeRef.current = context.currentTime;
    source.start(0);
    setIsPlaying(true);
  }, [audioBuffer]);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { /* ignore */ }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
  }, []);

  // Update progress bar
  useEffect(() => {
    let interval: number;
    if (isPlaying && audioBuffer && audioContextRef.current) {
      interval = window.setInterval(() => {
        const elapsed = audioContextRef.current!.currentTime - startTimeRef.current;
        const progress = (elapsed / audioBuffer.duration) * 100;
        setAudioProgress(Math.min(progress, 100));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioBuffer]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header with Logo */}
      <header className="flex flex-col items-center mb-10 text-center">
        <Logo className="w-20 h-20 mb-2" />
        <h1 className="text-4xl font-bold text-orange-800 flex items-center justify-center gap-2">
          <span className="marathi-text">मराठी</span> सेतु
        </h1>
        <p className="text-orange-600 font-medium italic mt-1">Marathi Setu — Your Bridge to Marathi Knowledge</p>
      </header>

      {/* Input Section */}
      <section className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-orange-100">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text in any language..."
                className="w-full h-40 p-4 rounded-2xl bg-orange-50 border-2 border-transparent focus:border-orange-300 focus:outline-none text-gray-800 text-lg transition-all resize-none"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <VoiceInput onTranscript={setInputText} isProcessing={isProcessing} />
              </div>
            </div>
            
            <button
              onClick={handleProcess}
              disabled={isProcessing || !inputText.trim()}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span className="marathi-text">अनुवाद करा</span> (Translate & Explain)
                </>
              )}
            </button>
          </div>
          {error && <p className="mt-4 text-red-600 text-sm font-medium">Error: {error}</p>}
        </div>
      </section>

      {/* Result Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Translation Card */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-orange-100 h-full">
              <h3 className="text-sm uppercase tracking-wider text-orange-400 font-bold mb-3">Translation</h3>
              <p className="marathi-text text-2xl text-orange-900 leading-relaxed font-bold">
                {result.marathiTranslation}
              </p>
            </div>

            {/* Explanation Card */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-orange-100 h-full">
              <h3 className="text-sm uppercase tracking-wider text-orange-400 font-bold mb-3">Marathi Explanation</h3>
              <p className="marathi-text text-lg text-gray-700 leading-relaxed">
                {result.marathiExplanation}
              </p>
            </div>
          </div>

          {/* Audio Feature Section */}
          <div className="bg-gradient-to-r from-orange-800 to-orange-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
             {/* Decorative pattern */}
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
             </div>

             <div className="relative z-10">
               <div className="flex flex-col md:flex-row items-center gap-6">
                 {/* Play Button */}
                 <button
                   onClick={isPlaying ? stopAudio : playAudio}
                   disabled={!audioBuffer}
                   className={`w-20 h-20 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
                     isPlaying ? 'bg-white text-orange-900' : 'bg-orange-500 text-white hover:bg-orange-400'
                   } disabled:opacity-50 shadow-xl`}
                 >
                   {isPlaying ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                   )}
                 </button>

                 <div className="flex-1 w-full space-y-4">
                   <div className="flex justify-between items-end mb-1">
                     <h4 className="text-xl font-bold marathi-text">स्पष्टीकरण ऐका (Listen to Explanation)</h4>
                     {audioBuffer && (
                       <span className="text-xs opacity-75 font-mono">
                         {audioBuffer.duration.toFixed(1)}s
                       </span>
                     )}
                   </div>

                   {/* Visualizer */}
                   <AudioVisualizer analyser={analyserNodeRef.current} isActive={isPlaying} />

                   {/* Progress Bar */}
                   <div className="relative h-2 bg-orange-950 rounded-full overflow-hidden">
                     <div 
                       className="absolute h-full bg-orange-400 transition-all duration-100 ease-linear"
                       style={{ width: `${audioProgress}%` }}
                     />
                   </div>

                   {/* Actions */}
                   <div className="flex items-center justify-between">
                     <p className="text-sm opacity-70 italic">AI Voice: Kore (Professional Marathi)</p>
                     
                     {downloadUrl && (
                       <a
                         href={downloadUrl}
                         download="marathi_explanation.wav"
                         className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all font-medium"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                         Download Audio
                       </a>
                     )}
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-20 text-center text-orange-700/60 text-sm">
        <p>Built with Gemini AI &middot; Advanced Marathi Speech Engine</p>
      </footer>
    </div>
  );
};

export default App;

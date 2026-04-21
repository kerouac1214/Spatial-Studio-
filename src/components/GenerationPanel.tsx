import React, { useState } from 'react';
import { X, Upload, Send, Image as ImageIcon, Sparkles, Map, User, Zap, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface GenerationPanelProps {
  snapshot: string | null;
  characters: any[];
  onClose: () => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({ snapshot, characters, onClose }) => {
  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const [charUrls, setCharUrls] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState('参照图1人物空间关系图，图2是场景图，图3是人物1，图4是人物2，图5是人物3，图6是人物4.');
  const [ratio, setRatio] = useState<'9:16' | '16:9'>('9:16');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!snapshot) {
      setError("请先捕捉空间站位图");
      return;
    }
    setLoading(true);
    setError(null);
    setLoadingStep('正在构建空间向量...');
    
    try {
      console.log("Starting generation flow...");
      
      // Step 1: Prep data
      setLoadingStep('正在上传素材...');
      await new Promise(r => setTimeout(r, 500)); // Minimal delay for visual feedback

      // Step 2: API Call
      setLoadingStep('深度生成中 (Nano Banana 2)...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          ratio,
          snapshot,
          charImages: charUrls,
          sceneRef: sceneUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `生成引擎繁忙 (Error: ${response.status})`);
      }

      // Step 3: Result processing
      setLoadingStep('正在渲染最终画质...');
      const result = await response.json();
      
      if (result.status === 'success') {
        setResultImage(result.imageUrl);
      } else {
        setError(result.message || '生成失败');
      }
    } catch (err) {
      console.error("Critical generation error:", err);
      setError(err instanceof Error ? err.message : '连接异常，请检查网络后重试');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleCharUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setCharUrls(prev => ({ ...prev, [id]: url }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
    >
      <div className="bg-[#0a0a0a] w-full max-w-6xl h-[90vh] rounded-[3rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/20">
              <Sparkles className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
                Nano Banana 2 <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] not-italic tracking-normal">PIPELINE V2.4</span>
              </h2>
              <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-[0.3em]">H-Fidelity Spatial Composition Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all group">
            <X size={24} className="text-neutral-500 group-hover:text-white" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 grid grid-cols-[1.5fr,360px] gap-8 overflow-hidden relative">
          
          {/* Result View (Overlay inside content) */}
          {resultImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 p-10"
            >
              <div className={cn(
                "relative rounded-[2.5rem] border-4 border-purple-500/50 shadow-[0_0_80px_rgba(168,85,247,0.2)] overflow-hidden bg-neutral-900",
                ratio === '9:16' ? "aspect-[9/16] h-full" : "aspect-video w-full max-w-4xl"
              )}>
                <img src={resultImage} className="w-full h-full object-cover" />
                <div className="absolute top-8 right-8 flex gap-4">
                   <button 
                    onClick={() => {
                       const link = document.createElement('a');
                       link.href = resultImage;
                       link.download = `composition-${Date.now()}.png`;
                       link.click();
                    }}
                    className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                   >
                     下载原图
                   </button>
                   <button 
                    onClick={() => setResultImage(null)}
                    className="px-6 py-3 bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-700 transition-all"
                   >
                     返回继续
                   </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Left Side: Visual Assets (Spatial, Scene, Characters) */}
          <div className="flex flex-col gap-6 min-h-0 pr-2 border-r border-white/5">
            
            {/* Row 1: Spatial Map & Scene Reference */}
            <div className="flex gap-6 h-[45%] shrink-0">
               {/* 1. Spatial Map */}
               <div className="flex-1 flex flex-col space-y-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <Map size={12} className="text-teal-400" />
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">空间图</label>
                  </div>
                  <div className="flex-1 bg-[#050505] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-inner ring-1 ring-white/5">
                    {snapshot ? (
                      <img src={snapshot} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="italic text-[9px] text-neutral-800 uppercase tracking-widest animate-pulse">Waiting for snapshot...</span>
                      </div>
                    )}
                  </div>
               </div>

               {/* 2. Scene Reference */}
               <div className="flex-1 flex flex-col space-y-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={12} className="text-blue-400" />
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">场景图</label>
                  </div>
                  <div className="flex-1 relative rounded-[2rem] border-2 border-dashed border-neutral-900 bg-[#050505] overflow-hidden transition-all group flex items-center justify-center cursor-pointer hover:border-blue-500/40">
                    {sceneUrl ? (
                      <img src={sceneUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <Upload size={24} className="mx-auto text-neutral-800 mb-2 group-hover:text-blue-400" />
                        <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest">点击上传场景</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSceneUrl(URL.createObjectURL(file));
                      }}
                    />
                  </div>
               </div>
            </div>

            {/* Row 2: Character Assets (Horizontal Scroll or Compact Grid) */}
            <div className="flex-1 flex flex-col space-y-4 min-h-0 pt-2 border-t border-white/5">
               <div className="flex items-center gap-2">
                  <User size={12} className="text-purple-400" />
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">人物资产 ({characters.length})</label>
               </div>
               <div className="flex-1 overflow-y-auto scrollbar-hide">
                 <div className="grid grid-cols-5 gap-3">
                   {characters.map((char) => (
                     <div key={char.id} className="relative group aspect-square">
                        <div className="w-full h-full rounded-2xl border-2 border-dashed border-neutral-900 bg-[#050505] overflow-hidden transition-all flex items-center justify-center cursor-pointer hover:border-purple-500/40">
                          {charUrls[char.id] ? (
                            <img src={charUrls[char.id]} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center group-hover:scale-110 transition-transform">
                              <Upload size={16} className="mx-auto text-neutral-800 mb-1 group-hover:text-purple-400" />
                              <p className="text-[7px] text-neutral-700 font-black">ID:{char.id.split('-').pop()}</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) handleCharUpload(char.id, file);
                            }}
                          />
                        </div>
                     </div>
                   ))}
                   {characters.length === 0 && (
                     <div className="col-span-5 py-6 text-center italic text-neutral-800 text-[9px] uppercase tracking-widest">
                       暂无角色资产
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </div>

          {/* Right Side: Controls (Prompt, Ratio, Generate) */}
          <div className="flex flex-col gap-8 overflow-hidden">
            
            {/* Top: Prompt Input Zone */}
            <div className="flex-[3] flex flex-col space-y-3 min-h-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-yellow-400" />
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">提示词输入</label>
                </div>
                <div className="flex-1 relative group min-h-0">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="输入场景风格、光影及材质描述..."
                    className="w-full h-full p-6 bg-[#050505] border border-white/5 rounded-3xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none text-neutral-300 placeholder:text-neutral-800 shadow-inner"
                  />
                </div>
            </div>

            {/* Middle: Ratio selection */}
            <div className="space-y-3 shrink-0">
                <div className="flex items-center gap-2">
                   <Maximize2 size={12} className="text-neutral-400" />
                   <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">渲染比例</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setRatio('9:16')}
                     className={cn(
                       "py-4 rounded-2xl border-2 font-black text-[9px] transition-all uppercase tracking-widest flex items-center justify-center gap-2",
                       ratio === '9:16' ? "bg-white text-black border-white" : "bg-neutral-900 border-white/5 text-neutral-600 hover:text-white"
                     )}
                   >
                     <div className="w-2 h-3.5 border border-current rounded-sm" />
                     9:16
                   </button>
                   <button 
                     onClick={() => setRatio('16:9')}
                     className={cn(
                       "py-4 rounded-2xl border-2 font-black text-[9px] transition-all uppercase tracking-widest flex items-center justify-center gap-2",
                       ratio === '16:9' ? "bg-white text-black border-white" : "bg-neutral-900 border-white/5 text-neutral-600 hover:text-white"
                     )}
                   >
                     <div className="w-3.5 h-2 border border-current rounded-sm" />
                     16:9
                   </button>
                </div>
            </div>

            {/* Bottom: Generate Button Zone */}
            <div className="space-y-4 pt-6 border-t border-white/5 shrink-0 mt-auto">
               {error && (
                 <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                   <p className="text-[9px] text-red-500 font-bold uppercase mb-1 tracking-widest">Error</p>
                   <p className="text-[9px] text-red-400 line-clamp-2">{error}</p>
                 </div>
               )}

               <button 
                 onClick={handleGenerate}
                 disabled={loading || !snapshot}
                 className={cn(
                   "w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 font-black text-lg uppercase tracking-[0.4em] transition-all relative overflow-hidden group",
                   loading || !snapshot 
                     ? "bg-[#070707] text-neutral-800 border border-white/5" 
                     : "bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-xl shadow-indigo-500/10 hover:scale-[1.01]"
                 ) }
               >
                 {loading ? (
                   <div className="flex items-center gap-3">
                     <div className="w-5 h-5 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                     <span className="text-[9px] tracking-widest opacity-50">{loadingStep || 'GEN...'}</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-4">
                     <span>执行生成</span>
                     <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </div>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

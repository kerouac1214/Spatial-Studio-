import React, { useState } from 'react';
import { 
  Layers, 
  Settings2, 
  Sparkles, 
  Video, 
  Image as ImageIcon,
  User,
  Sun,
  Maximize2,
  ChevronRight,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Character, SceneState } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  state: SceneState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateState: (updates: Partial<SceneState>) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
  onAddDummy: () => void;
  onRemoveCharacter: (id: string) => void;
  onOptimize: () => void;
  optimizing: boolean;
  suggestions: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  state, 
  selectedId, 
  onSelect,
  onUpdateState, 
  onUpdateCharacter,
  onAddDummy,
  onRemoveCharacter,
  onOptimize,
  optimizing,
  suggestions
}) => {
  const selectedChar = state.characters.find(c => c.id === selectedId);
  const [activeTab, setActiveTab] = useState<'layers' | 'lighting' | 'ai'>('layers');

  return (
    <div className="w-80 h-full bg-neutral-950 border-l border-neutral-800 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-900/50">
        {[
          { id: 'layers', icon: Layers, label: '图层' },
          { id: 'lighting', icon: Sun, label: '环境' },
          { id: 'ai', icon: Sparkles, label: 'AI优化' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-4 flex flex-col items-center gap-1 transition-all relative",
              activeTab === tab.id ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <tab.icon size={18} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {activeTab === 'layers' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                <ImageIcon size={14} /> 场景背景
              </h3>
              <div className="group relative aspect-video rounded-lg border-2 border-dashed border-neutral-800 hover:border-neutral-600 transition-colors overflow-hidden flex items-center justify-center bg-neutral-900 cursor-pointer">
                {state.backgroundUrl ? (
                  <img src={state.backgroundUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="mx-auto text-neutral-600 mb-2" size={24} />
                    <p className="text-[10px] text-neutral-500">点击上传背景</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      onUpdateState({ backgroundUrl: url });
                    }
                  }}
                />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                  <User size={14} /> 人物角色 ({state.characters.length})
                </h3>
                <button 
                  onClick={onAddDummy}
                  className="p-1 px-2 rounded bg-blue-600 text-[10px] font-bold flex items-center gap-1 hover:bg-blue-500 transition-all"
                >
                  <Plus size={12} /> 添加假人
                </button>
              </div>
              <div className="space-y-3">
                {state.characters.map((char) => (
                  <div 
                    key={char.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer group relative",
                      selectedId === char.id 
                        ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                    )}
                    onClick={() => onSelect(char.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
                        {char.imageUrl ? (
                           <img src={char.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={20} className="text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white truncate">{char.name}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCharacter(char.id, { isVisible: !char.isVisible });
                              }}
                              className={cn("p-1 rounded-md transition-all", char.isVisible ? "text-green-500" : "text-neutral-600")}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveCharacter(char.id);
                              }}
                              className="p-1 text-neutral-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          POS: {char.position[0].toFixed(1)}, {char.position[2].toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {state.characters.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-neutral-800 rounded-xl">
                    <p className="text-[10px] text-neutral-500">点击上方按钮添加假人进行构图</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'lighting' && (
          <div className="space-y-8">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center justify-between">
                <span>光影控制</span>
                <Settings2 size={14} />
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>亮度 (Intensity)</span>
                    <span className="font-mono text-white">{state.lighting.intensity.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="5" step="0.1" 
                    value={state.lighting.intensity}
                    onChange={(e) => onUpdateState({ lighting: { ...state.lighting, intensity: parseFloat(e.target.value) } })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-neutral-400">光源位置 (Direction)</span>
                  <div className="grid grid-cols-2 gap-3">
                    {['Top Left', 'Top Right', 'Front', 'Back'].map((pos) => (
                      <button 
                        key={pos}
                        onClick={() => {
                          const coords: Record<string, [number, number, number]> = {
                            'Top Left': [-5, 5, 5],
                            'Top Right': [5, 5, 5],
                            'Front': [0, 5, 10],
                            'Back': [0, 5, -10]
                          };
                          onUpdateState({ lighting: { ...state.lighting, position: coords[pos] } });
                        }}
                        className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center justify-between">
                <span>摄像机设置</span>
                <Video size={14} />
              </h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>视角 (FOV)</span>
                    <span className="font-mono text-white">{state.camera.fov}</span>
                  </div>
                  <input 
                    type="range" min="20" max="100" step="1" 
                    value={state.camera.fov}
                    onChange={(e) => onUpdateState({ camera: { ...state.camera, fov: parseInt(e.target.value) } })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <button 
                  onClick={() => onUpdateState({ camera: { ...state.camera, position: [0, 2, 10], target: [0, 0, 0] } })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-white hover:bg-neutral-800 transition-all"
                >
                  <RotateCcw size={14} /> 重置视角
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <button 
              onClick={onOptimize}
              disabled={optimizing}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl transition-all shadow-xl",
                optimizing 
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                  : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:scale-[1.02] active:scale-95"
              )}
            >
              {optimizing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-xs font-bold tracking-tight">AI 深度分析中...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span className="text-xs font-bold tracking-tight">智能站位优化</span>
                </>
              )}
            </button>

            {suggestions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI 优化建议</span>
                  <div className="flex gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-blue-500/50" />
                    <span className="inline-block w-1 h-1 rounded-full bg-blue-500/50" />
                    <span className="inline-block w-1 h-1 rounded-full bg-blue-500" />
                  </div>
                </div>
                <div className="text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap font-sans">
                  {suggestions}
                </div>
              </motion.div>
            )}

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <p className="text-[10px] text-neutral-400 leading-normal italic">
                提示: AI会根据当前3D场景中的角色深度、间距和背景透视提供优化建议，以匹配 nano banana2 模型的空间生成特性。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

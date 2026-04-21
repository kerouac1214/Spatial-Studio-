import React, { useState, useEffect, useRef } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { Sidebar } from './components/Sidebar';
import { BottomToolbar } from './components/BottomToolbar';
import { GenerationPanel } from './components/GenerationPanel';
import { Character, SceneState } from './types';
import { getPlacementOptimization } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Maximize2, Zap } from 'lucide-react';
import { cn } from './lib/utils';

const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char-1',
    name: '主人物 A',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [2, 3, 1],
    isVisible: true,
  },
  {
    id: 'char-2',
    name: '配角 B',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
    position: [-2.5, 0, -1],
    rotation: [0, 0, 0],
    scale: [1.8, 2.7, 1],
    isVisible: true,
  },
  {
    id: 'char-3',
    name: '背景人物 C',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    position: [2.5, 0, -2],
    rotation: [0, 0, 0],
    scale: [1.5, 2.3, 1],
    isVisible: true,
  },
  {
    id: 'char-4',
    name: '前景元素 D',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
    position: [1.5, -0.5, 2],
    rotation: [0, 0, 0],
    scale: [2.2, 3.3, 1],
    isVisible: true,
  },
];

const INITIAL_STATE: SceneState = {
  backgroundUrl: null,
  characters: INITIAL_CHARACTERS,
  lighting: {
    intensity: 1,
    color: '#ffffff',
    position: [5, 5, 5],
  },
  camera: {
    fov: 45,
    position: [0, 2, 8],
    target: [0, 0, 0],
  },
  visualMode: 'cinematic',
  snapshot: null,
  generationSettings: {
    ratio: '9:16',
    characterImages: {},
  },
};

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CroppingOverlay: React.FC<{ 
  ratio: '9:16' | '16:9', 
  onConfirm: (area: CropBox) => void, 
  onCancel: () => void 
}> = ({ ratio, onConfirm, onCancel }) => {
  const [box, setBox] = useState<CropBox>({ x: 100, y: 100, width: 200, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startBox = useRef<CropBox>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    // Initial size based on ratio
    const rValue = ratio === '9:16' ? 9/16 : 16/9;
    setBox(prev => ({ ...prev, height: prev.width / rValue }));
  }, [ratio]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startBox.current = { ...box };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      
      setBox(prev => ({
        ...prev,
        x: startBox.current.x + dx,
        y: startBox.current.y + dy
      }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleConfirm = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Normalize coordinates relative to the container (which should match the canvas)
    onConfirm({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    });
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-[60] bg-black/40 cursor-crosshair overflow-hidden pointer-events-auto">
      <div 
        className="absolute border-2 border-dashed border-teal-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move flex flex-col items-center justify-end"
        style={{ 
          left: box.x, 
          top: box.y, 
          width: box.width, 
          height: box.height,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
          正在调整截图区域 ({ratio})
        </div>
        
        <div className="flex gap-2 p-2 translate-y-full mt-2">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            取消
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20"
          >
            确定快照
          </button>
        </div>

        {/* Resize handle (bottom right) */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-teal-500 rounded-tl-lg flex items-center justify-center"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startW = box.width;
            const rValue = ratio === '9:16' ? 9/16 : 16/9;

            const onMove = (moveEvent: MouseEvent) => {
              const dx = moveEvent.clientX - startX;
              const newW = Math.max(50, startW + dx);
              setBox(prev => ({
                ...prev,
                width: newW,
                height: newW / rValue
              }));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          <div className="w-1 h-3 bg-white/40 rounded-full rotate-45 translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<SceneState>(INITIAL_STATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(true);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showRatioSelector, setShowRatioSelector] = useState(false);
  const [snapshotRatio, setSnapshotRatio] = useState<'9:16' | '16:9'>('9:16');
  const [isCropping, setIsCropping] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const addDummy = () => {
    const nextId = `char-${state.characters.length + 1}`;
    const newChar: Character = {
      id: nextId,
      name: `Dummy ${state.characters.length + 1}`,
      imageUrl: '', // No image required for staging
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      isVisible: true,
    };
    setState(prev => ({ ...prev, characters: [...prev.characters, newChar] }));
    setSelectedId(nextId);
  };

  const removeCharacter = (id: string) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSnapshotRequest = () => {
    setShowRatioSelector(true);
  };

  const performSnapshot = (ratio: '9:16' | '16:9') => {
    setSnapshotRatio(ratio);
    setShowRatioSelector(false);
    setIsCropping(true);
    // Switch to spatial map for preview if needed, but the user wants to crop CURRENT view
    // so we stay in current view but maybe switch temporarily for the final capture
  };

  const handleFinalCapture = (area: CropBox) => {
    // Save current selection for restoration later
    const previousSelectedId = selectedId;
    
    // Deselect and stop cropping UI immediately to clear visual noise
    setSelectedId(null);
    setIsCropping(false);
    
    // Temporarily switch to spatial map for capture (now shows dummies on black)
    setState(prev => ({ ...prev, visualMode: 'spatial-map' }));
    
    // Wait longer for the 3D scene and HTML overlays to stabilize in the new view
    setTimeout(() => {
      const canvasContainer = document.querySelector('.flex-1.relative'); // Container of ThreeCanvas
      const canvas = document.querySelector('canvas');
      
      if (canvas && canvasContainer) {
        const containerRect = canvasContainer.getBoundingClientRect();
        
        // Use an offscreen canvas to crop
        const offCanvas = document.createElement('canvas');
        offCanvas.width = area.width;
        offCanvas.height = area.height;
        const ctx = offCanvas.getContext('2d');
        
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          
          // CRITICAL: We must account for the canvas's position relative to the viewport
          // since 'area' coordinates are relative to the container.
          const canvasRect = canvas.getBoundingClientRect();
          const offsetX = area.x + (containerRect.left - canvasRect.left);
          const offsetY = area.y + (containerRect.top - canvasRect.top);

          ctx.drawImage(
            canvas,
            offsetX * dpr, 
            offsetY * dpr, 
            area.width * dpr, 
            area.height * dpr,
            0, 0, area.width, area.height
          );
          
          const dataUrl = offCanvas.toDataURL('image/png');
          setSnapshot(dataUrl);
          setShowGenerator(true);
        }
        
        // Restore previous state after a short delay
        setTimeout(() => {
          setState(prev => ({ ...prev, visualMode: 'cinematic' }));
          setSelectedId(previousSelectedId);
        }, 100);
      }
    }, 500); // Increased delay for stability
  };
   
  const handleOptimize = async () => {
    setOptimizing(true);
    const sceneData = {
      characterPositions: state.characters.map(c => ({ name: c.name, pos: c.position, scale: c.scale })),
      lighting: state.lighting,
      camera: state.camera
    };
    const result = await getPlacementOptimization(sceneData);
    setSuggestions(result);
    setOptimizing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newChars = files.map((file, i) => {
      const charIndex = state.characters.length + i + 1;
      return {
        id: `char-${charIndex}`,
        name: file.name.split('.')[0],
        imageUrl: URL.createObjectURL(file),
        position: [(Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [2, 3, 1] as [number, number, number],
        isVisible: true,
      };
    });
    setState(prev => ({
      ...prev,
      characters: [...prev.characters, ...newChars]
    }));
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Main Studio View */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-6 bg-[#0f0f0f] border-b border-[#1a1a1a] z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                <Zap size={16} className="text-white fill-white" />
              </div>
              <h1 className="text-xs font-bold tracking-widest text-teal-500 uppercase">Spatial Studio <span className="text-neutral-600 ml-1">PRO</span></h1>
            </div>
            <div className="h-4 w-px bg-neutral-800" />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAI(!showAI)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  showAI ? "text-teal-400 bg-teal-500/10" : "text-neutral-500 hover:text-white"
                )}
              >
                <Sparkles size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">AI Ready</span>
            </div>
            <button 
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-neutral-800 hover:border-neutral-700 text-[10px] font-black uppercase tracking-widest transition-all"
              onClick={() => alert("场景已导出至您的项目。")}
            >
              Export Scene
            </button>
          </div>
        </header>

        <main className="flex-1 relative bg-black flex flex-col">
          {/* 3D Scene */}
          <div className="flex-1 relative">
            <ThreeCanvas 
              state={state} 
              selectedId={selectedId} 
              setSelectedId={setSelectedId}
              updateCharacter={updateCharacter}
            />
            {/* Cropping UI Overlay */}
            {isCropping && (
              <CroppingOverlay 
                ratio={snapshotRatio} 
                onConfirm={handleFinalCapture} 
                onCancel={() => setIsCropping(false)}
              />
            )}
          </div>

          {/* New Bottom Toolbar */}
          <BottomToolbar 
            memberCount={state.characters.length}
            onAdd={addDummy}
            onClear={() => setState(prev => ({ ...prev, characters: [] }))}
            onToggleView={() => setState(prev => ({ ...prev, visualMode: prev.visualMode === 'cinematic' ? 'spatial-map' : 'cinematic' }))}
            onSnapshot={handleSnapshotRequest}
            onToggleGenerator={() => setShowGenerator(true)}
            isMapMode={state.visualMode === 'spatial-map'}
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </main>
      </div>

      {/* Snapshot Ratio Modal */}
      <AnimatePresence>
        {showRatioSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121212] p-8 rounded-3xl border border-neutral-800 shadow-2xl flex flex-col items-center gap-6"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">选择快照比例</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => performSnapshot('9:16')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="w-12 h-20 border-2 border-neutral-700 group-hover:border-blue-500 transition-all rounded" />
                  <span className="text-xs font-bold font-mono">9:16 (竖屏)</span>
                </button>
                <button 
                  onClick={() => performSnapshot('16:9')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="w-20 h-12 border-2 border-neutral-700 group-hover:border-blue-500 transition-all rounded" />
                  <span className="text-xs font-bold font-mono">16:9 (横屏)</span>
                </button>
              </div>
              <button 
                onClick={() => setShowRatioSelector(false)}
                className="text-[10px] uppercase font-bold text-neutral-600 hover:text-white"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Sidebar (Optional) */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Sidebar 
              state={state} 
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateState={(updates) => setState(prev => ({ ...prev, ...updates }))}
              onUpdateCharacter={updateCharacter}
              onAddDummy={addDummy}
              onRemoveCharacter={removeCharacter}
              onOptimize={handleOptimize}
              optimizing={optimizing}
              suggestions={suggestions}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerator && (
          <GenerationPanel 
            snapshot={snapshot} 
            characters={state.characters}
            onClose={() => setShowGenerator(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

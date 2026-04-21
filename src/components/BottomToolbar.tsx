import React from 'react';
import { 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Grid3X3, 
  Shuffle, 
  Trash2,
  Users,
  Camera,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomToolbarProps {
  memberCount: number;
  onAdd: () => void;
  onClear: () => void;
  onToggleView: () => void;
  onSnapshot: () => void;
  onToggleGenerator: () => void;
  isMapMode: boolean;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({ 
  memberCount, 
  onAdd, 
  onClear,
  onToggleView,
  onSnapshot,
  onToggleGenerator,
  isMapMode
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-[#121212] border-t border-[#1a1a1a]">
      {/* Primary Tools */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1">
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 font-bold text-sm transition-all border border-blue-600/10"
          >
            <Plus size={18} />
            <span>添加假人角色</span>
          </button>
        </div>

        <button 
          onClick={onClear}
          className="flex items-center gap-2 px-6 py-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/30 border border-red-900/10 font-bold text-sm transition-all"
        >
          <Trash2 size={18} />
          <span>一键清空舞台</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center justify-center gap-8 py-2 border-t border-neutral-800/30 mt-1">
        <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
          <Users size={14} />
          <span>{memberCount}个</span>
        </div>
        
        <div className="h-4 w-px bg-neutral-800" />
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onSnapshot}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600/10 text-blue-400 text-[11px] font-bold border border-blue-600/5 hover:bg-blue-600/20"
          >
            <ImageIcon size={12} />
            <span>快照</span>
          </button>
          <button 
            onClick={onToggleGenerator}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-600/10 text-purple-400 text-[11px] font-bold border border-purple-600/5 hover:bg-purple-600/20"
          >
            <Layers size={12} />
            <span>生成引擎</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-[11px] font-bold border border-blue-500/5">
            <Users size={12} />
            <span>假人</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-500/10 text-teal-400 text-[11px] font-bold border border-teal-500/5">
            <Camera size={12} />
            <span>相机</span>
          </button>
        </div>
      </div>
    </div>
  );
};

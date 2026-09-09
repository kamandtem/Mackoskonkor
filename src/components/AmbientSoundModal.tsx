import React, { useState } from 'react';
import { X, CloudRain, Trees, Waves, Flame, Radio, Music, VolumeX, Volume2 } from 'lucide-react';
import { AmbientSoundId } from '../types/konkur';
import { soundEngine } from '../utils/soundEngine';

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSound: AmbientSoundId;
  onSelectSound: (sound: AmbientSoundId) => void;
}

const SOUNDS = [
  { id: 'rain' as AmbientSoundId, name: 'باران ملایم', desc: 'صدای آرام‌بخش قطرات باران', icon: CloudRain, color: 'text-sky-500 bg-sky-50' },
  { id: 'waves' as AmbientSoundId, name: 'موج دریا', desc: 'امواج آرام سواحل اقیانوس', icon: Waves, color: 'text-teal-500 bg-teal-50' },
  { id: 'forest' as AmbientSoundId, name: 'جنگل و نسیم', desc: 'وزش نسیم در میان درختان', icon: Trees, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'fireplace' as AmbientSoundId, name: 'شومینه آرام', desc: 'سوختن آرام هیزم و گرما', icon: Flame, color: 'text-amber-500 bg-amber-50' },
  { id: 'whitenoise' as AmbientSoundId, name: 'نویز سفید (White Noise)', desc: 'فرکانس یکنواخت برای حذف صدای محیط', icon: Radio, color: 'text-indigo-500 bg-indigo-50' },
  { id: 'lofi' as AmbientSoundId, name: 'هارمونی لو-فای', desc: 'نواهای سینت عمیق و آرام', icon: Music, color: 'text-purple-500 bg-purple-50' },
];

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = ({
  isOpen,
  onClose,
  currentSound,
  onSelectSound,
}) => {
  const [volume, setVolume] = useState(0.6);

  if (!isOpen) return null;

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundEngine.setVolume(v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">صداهای تمرکز (آفلاین)</h3>
              <p className="text-xs text-slate-400 font-medium">پخش بدون نیاز به اینترنت و بدون قطعی</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-600 min-w-[32px] text-left">
            {Math.round(volume * 100)}٪
          </span>
        </div>

        {/* Stop Button */}
        <button
          onClick={() => onSelectSound('none')}
          className={`w-full py-2.5 px-4 rounded-2xl mb-3 text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
            currentSound === 'none'
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50'
          }`}
        >
          <VolumeX className="w-4 h-4" />
          <span>قطع صدا (سکوت کامل)</span>
        </button>

        {/* Sound List */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto no-scrollbar py-1">
          {SOUNDS.map((s) => {
            const isSelected = currentSound === s.id;
            const IconComp = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSound(s.id)}
                className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all border ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-2xs'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${s.color}`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-800 mb-0.5">{s.name}</span>
                <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{s.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
        >
          بستن و ادامه تمرکز
        </button>
      </div>
    </div>
  );
};

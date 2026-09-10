import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Trash2, User, X } from 'lucide-react';
import { MajorType, UserProfile } from '../types/konkur';
import { ALL_MAJORS } from '../utils/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile, resetSubjectsForMajor: boolean) => void;
}

/** عکس انتخابی را به مربع ۲۵۶ پیکسلی و data URL سبک تبدیل می‌کند */
async function fileToSquareDataUrl(file: File, size = 256): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode-failed'));
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  const side = Math.min(image.width, image.height);
  const sx = (image.width - side) / 2;
  const sy = (image.height - side) / 2;
  ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [major, setMajor] = useState<MajorType>(profile.major);
  const [avatar, setAvatar] = useState(profile.avatarDataUrl ?? '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(profile.name);
    setMajor(profile.major);
    setAvatar(profile.avatarDataUrl ?? '');
    setError('');
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handlePickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('فقط فایل تصویری قابل انتخاب است.');
      return;
    }
    try {
      setAvatar(await fileToSquareDataUrl(file));
      setError('');
    } catch {
      setError('خواندن این عکس ممکن نشد. عکس دیگری انتخاب کنید.');
    }
  };

  const handleSave = () => {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('نام باید حداقل دو حرف باشد.');
      return;
    }
    onSaveProfile(
      { ...profile, name: cleanName.slice(0, 40), major, avatarDataUrl: avatar },
      major !== profile.major,
    );
    onClose();
  };

  const initial = name.trim().charAt(0) || 'ک';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-5 safe-sheet-bottom shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-800">پروفایل من</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* عکس پروفایل */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[3px] shadow-sm">
              <div className="w-full h-full rounded-[20px] bg-white overflow-hidden flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="عکس پروفایل" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-indigo-600">{initial}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="انتخاب عکس"
              className="absolute -bottom-1.5 -left-1.5 w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 active:scale-90 transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-slate-600 leading-relaxed">
              عکس خودت را از گالری انتخاب کن؛ روی همین گوشی ذخیره می‌شود و جایی ارسال نمی‌شود.
            </p>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="mt-2 text-[11px] font-black text-rose-500 flex items-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف عکس
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePickFile}
            className="hidden"
          />
        </div>

        {/* نام */}
        <label className="block mb-4">
          <span className="text-[11px] font-black text-slate-500 mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            نام و نام خانوادگی
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً کامند"
            maxLength={40}
            className="w-full soft-card-inner px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        {/* رشته */}
        <div className="mb-5">
          <span className="text-[11px] font-black text-slate-500 mb-1.5 block">رشته‌ی تحصیلی</span>
          <div className="flex flex-wrap gap-2">
            {ALL_MAJORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMajor(option)}
                className={`px-3.5 py-2 rounded-2xl text-[12px] font-black transition-all ${
                  major === option
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {major !== profile.major && (
            <p className="text-[11px] font-bold text-amber-600 mt-2">
              با تغییر رشته، فهرست دروس به حالت پیش‌فرض رشته‌ی تازه برمی‌گردد.
            </p>
          )}
        </div>

        {error && (
          <p className="text-[11px] font-black text-rose-500 mb-3">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center gap-2 soft-button"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          ثبت تغییرات
        </button>
      </div>
    </div>
  );
};

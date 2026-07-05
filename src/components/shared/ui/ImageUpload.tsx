import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onClear,
  label = 'HÃ¬nh áº£nh sáº£n pháº©m / danh má»¥c',
  className = '',
}: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lÃ²ng chá»‰ táº£i lÃªn file hÃ¬nh áº£nh!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-400 uppercase">{label}</label>}
      
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200/80 aspect-video max-h-40 bg-slate-50 flex items-center justify-center">
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onButtonClick}
              className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg text-xs font-bold transition-transform hover:scale-105 shadow-sm"
            >
              Thay Ä‘á»•i
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-transform hover:scale-105 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 min-h-[100px] ${
            isDragActive
              ? 'border-blue-500 bg-blue-50/30'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">
              KÃ©o tháº£ hÃ¬nh áº£nh vÃ o Ä‘Ã¢y hoáº·c <span className="text-blue-600 hover:underline">chá»n tá»« thiáº¿t bá»‹</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, GIF lÃªn Ä‘áº¿n 5MB</p>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}


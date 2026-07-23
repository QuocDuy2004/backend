import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  values?: string[];
  onChange: (value: string) => void;
  onChangeMany?: (values: string[]) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
  multiple?: boolean;
  maxFiles?: number;
}

const maxImageSizeMb = 5;
const maxImageSizeBytes = maxImageSizeMb * 1024 * 1024;
const maxImageDimension = 1200;
const maxCompressedImageBytes = 350 * 1024;

const dataUrlBytes = (value: string) => Math.ceil((value.length * 3) / 4);

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Không thể xử lý ảnh. Vui lòng thử ảnh khác.'));
  image.src = src;
});

const resizeImageDataUrl = async (sourceDataUrl: string) => {
  const image = await loadImage(sourceDataUrl);
  const scale = Math.min(1, maxImageDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return sourceDataUrl;

  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const qualities = [0.78, 0.68, 0.58, 0.48, 0.38];
  let output = canvas.toDataURL('image/jpeg', qualities[0]);

  for (const quality of qualities.slice(1)) {
    if (dataUrlBytes(output) <= maxCompressedImageBytes) break;
    output = canvas.toDataURL('image/jpeg', quality);
  }

  return output;
};

export default function ImageUpload({
  value,
  values,
  onChange,
  onChangeMany,
  onClear,
  label = 'Hình ảnh sản phẩm / danh mục',
  className = '',
  multiple = false,
  maxFiles = 8,
}: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageValues = values || (value ? [value] : []);

  const readImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chỉ tải lên file hình ảnh!'));
      return;
    }

    if (file.size > maxImageSizeBytes) {
      reject(new Error(`Vui lòng chọn ảnh tối đa ${maxImageSizeMb}MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resizeImageDataUrl(e.target.result)
          .then(resolve)
          .catch(reject);
        return;
      }
      reject(new Error('Không thể đọc file hình ảnh.'));
    };
    reader.onerror = () => reject(new Error('Không thể đọc file hình ảnh.'));
    reader.readAsDataURL(file);
  });

  const updateImages = (nextImages: string[]) => {
    const normalized = nextImages.slice(0, maxFiles);
    if (multiple && onChangeMany) {
      onChangeMany(normalized);
      return;
    }

    onChange(normalized[0] || '');
  };

  const handleFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;

    try {
      const readableFiles = multiple
        ? selectedFiles.slice(0, Math.max(0, maxFiles - imageValues.length))
        : selectedFiles.slice(0, 1);
      const nextImages = await Promise.all(readableFiles.map(readImageFile));
      updateImages(multiple ? [...imageValues, ...nextImages] : nextImages);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể tải ảnh.');
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-400 uppercase">{label}</label>}
      
      {imageValues.length > 0 ? (
        <div className="space-y-2">
        <div className="relative group rounded-xl overflow-hidden border border-slate-200/80 aspect-video max-h-40 bg-slate-50 flex items-center justify-center">
          <img
            src={imageValues[0]}
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
              Thay đổi
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
        {multiple && (
          <div className="grid grid-cols-4 gap-2">
            {imageValues.map((image, index) => (
              <div key={`${image.slice(0, 32)}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={image} alt={`Ảnh sản phẩm ${index + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => updateImages(imageValues.filter((_, imageIndex) => imageIndex !== index))}
                  className="absolute right-1 top-1 hidden rounded-full bg-rose-600 p-1 text-white shadow-sm group-hover:block"
                  title="Xóa ảnh"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {imageValues.length < maxFiles && (
              <button
                type="button"
                onClick={onButtonClick}
                className="aspect-square rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600"
              >
                Thêm ảnh
              </button>
            )}
          </div>
        )}
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
              Kéo thả hình ảnh vào đây hoặc <span className="text-blue-600 hover:underline">chọn từ thiết bị</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, GIF lên đến 5MB{multiple ? `, tối đa ${maxFiles} ảnh` : ''}</p>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept="image/*"
        multiple={multiple}
        className="hidden"
      />
    </div>
  );
}


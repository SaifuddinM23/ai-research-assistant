import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

export default function DocumentUploader({ onUpload, isUploading, progress }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept=".pdf"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500 text-gray-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
      >
        <Upload className="w-3.5 h-3.5 text-indigo-400" />
        <span>{isUploading ? `Uploading (${progress || 0}%)...` : 'Upload PDF Document'}</span>
      </button>
    </div>
  );
}

import React, { useRef } from 'react';
import { SlideData, TemplateId } from '../types';
import { FileText, MessageSquare, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

interface SlidePreviewProps {
  slide: SlideData;
  index: number;
  template: TemplateId;
  onUpdateImage: (file: File | null) => void;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, index, template, onUpdateImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateImage(file);
    }
  };

  const getHeaderColor = () => {
    switch(template) {
      case 'dark': return 'bg-gray-900';
      case 'corporate': return 'bg-emerald-700';
      case 'modern': return 'bg-slate-900';
      case 'classic': default: return 'bg-blue-600';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-300 group">
      <div className={`${getHeaderColor()} text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex justify-between items-center`}>
        <span>Slide {index + 1}</span>
        <div className="flex space-x-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-blue-200 transition-colors"
                title="Add Slide Image"
            >
                <ImageIcon size={14} />
            </button>
            <FileText size={14} className="text-white/50" />
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-4 leading-tight">{slide.title}</h3>
        
        <div className="flex-grow flex gap-4">
            <ul className="space-y-2 flex-1">
            {slide.bulletPoints.map((point, idx) => (
                <li key={idx} className="flex items-start text-sm text-slate-600">
                <span className={`mr-2 font-bold ${template === 'dark' ? 'text-indigo-500' : 'text-blue-500'}`}>•</span>
                {point}
                </li>
            ))}
            </ul>
            
            {slide.image && (
                <div className="w-1/3 min-w-[100px] relative rounded overflow-hidden border border-slate-200 self-start">
                    <img src={slide.image} alt="Slide attachment" className="w-full h-auto object-cover" />
                    <button 
                        onClick={() => onUpdateImage(null)}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}
        </div>
        
        {/* Hidden Input for Image Upload */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
        />
      </div>

      <div className="bg-slate-50 border-t border-slate-100 p-4">
        <div className="flex items-center text-slate-400 mb-2">
          <MessageSquare size={14} className="mr-2" />
          <span className="text-xs font-medium uppercase">Speaker Notes</span>
        </div>
        <p className="text-xs text-slate-500 italic line-clamp-3">
          {slide.speakerNotes}
        </p>
      </div>
    </div>
  );
};
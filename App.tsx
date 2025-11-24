import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  FileText, 
  Loader2, 
  Presentation, 
  Download, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  X
} from 'lucide-react';
import { AppStatus, GenerationConfig, PresentationData, TemplateId, SlideData } from './types';
import { extractTextFromPdf } from './services/pdfService';
import { generatePresentationContent } from './services/geminiService';
import { generatePptFile } from './services/pptService';
import { SlidePreview } from './components/SlidePreview';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  
  // Configuration State
  const [config, setConfig] = useState<GenerationConfig>({
    numSlides: 8,
    detailLevel: 'brief',
    audience: 'academic',
    template: 'classic',
    titleImage: undefined
  });

  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleImageInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.PARSING_PDF);
    setErrorMsg(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        throw new Error('Unsupported file format. Please upload PDF or TXT.');
      }

      if (text.length < 50) {
        throw new Error('The document appears to be empty or unreadable.');
      }

      setInputText(text);
      setStatus(AppStatus.IDLE);
      setActiveTab('text');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to parse file.');
      setStatus(AppStatus.ERROR);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTitleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setConfig({ ...config, titleImage: base64 });
    } catch (err) {
      console.error("Image upload failed", err);
      setErrorMsg("Failed to process image.");
    }
  };

  const removeTitleImage = () => {
    setConfig({ ...config, titleImage: undefined });
    if (titleImageInputRef.current) titleImageInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setErrorMsg("Please provide text or upload a document first.");
      return;
    }

    setStatus(AppStatus.GENERATING_CONTENT);
    setErrorMsg(null);

    try {
      const data = await generatePresentationContent(inputText, config);
      // Merge config visuals into the data
      setPresentationData({
        ...data,
        template: config.template,
        titleImage: config.titleImage
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "AI Generation failed. Please try again.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleUpdateSlideImage = async (index: number, file: File | null) => {
    if (!presentationData) return;
    
    const newSlides = [...presentationData.slides];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        newSlides[index] = { ...newSlides[index], image: base64 };
      } catch (err) {
        console.error("Failed to update slide image", err);
        return;
      }
    } else {
      // Remove image
      newSlides[index] = { ...newSlides[index], image: undefined };
    }
    
    setPresentationData({
      ...presentationData,
      slides: newSlides
    });
  };

  const handleDownload = async () => {
    if (!presentationData) return;
    setStatus(AppStatus.GENERATING_PPT);
    try {
      await generatePptFile(presentationData);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate PPT file.");
      setStatus(AppStatus.ERROR);
    }
  };

  const resetApp = () => {
    setPresentationData(null);
    setInputText('');
    setStatus(AppStatus.IDLE);
    setActiveTab('upload');
    setErrorMsg(null);
    setConfig({ ...config, titleImage: undefined });
  };

  // Styles for the template preview
  const getTemplatePreviewClass = (id: TemplateId) => {
    const base = "w-full h-12 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center text-xs font-bold";
    const selected = config.template === id ? "ring-2 ring-offset-2 ring-blue-500 scale-105" : "hover:scale-105";
    
    let colors = "";
    switch(id) {
      case 'modern': colors = "bg-slate-100 border-slate-300 text-slate-800"; break;
      case 'dark': colors = "bg-slate-900 border-slate-700 text-white"; break;
      case 'corporate': colors = "bg-white border-emerald-500 text-emerald-800"; break;
      case 'classic': default: colors = "bg-blue-50 border-blue-200 text-blue-700"; break;
    }
    
    return `${base} ${selected} ${colors}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={resetApp}>
            <div className="bg-blue-600 p-2 rounded-lg">
              <Presentation className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
              Research2PPT
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="flex-grow bg-slate-50">
        {!presentationData ? (
          // Input Section
          <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Turn Documents into Presentations</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload your research paper, documentation, or notes. 
                Select a style, add images, and let AI build your slide deck.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === 'upload' 
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileUp size={18} />
                  <span>Upload Document</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === 'text' 
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText size={18} />
                  <span>Paste Text</span>
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'upload' ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-white transition-colors">
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                      <FileUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Upload File</h3>
                    <p className="text-slate-500 text-sm mb-6 text-center">
                      Supports PDF and TXT documents. Max size 10MB.<br/>
                      <span className="text-xs text-slate-400">Files are processed locally in your browser.</span>
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all ${status === AppStatus.PARSING_PDF ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {status === AppStatus.PARSING_PDF ? 'Reading Document...' : 'Select Document'}
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label htmlFor="text-input" className="block text-sm font-medium text-slate-700">
                      Content Source
                    </label>
                    <textarea
                      id="text-input"
                      rows={12}
                      className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                      placeholder="Paste your abstract, introduction, or full paper text here..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    ></textarea>
                  </div>
                )}

                {/* Configuration Options */}
                {inputText.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="flex items-center space-x-2 mb-6">
                        <Palette className="text-blue-600" size={20} />
                        <h3 className="text-lg font-semibold text-slate-900">Customize Presentation</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Styles */}
                        <div className="space-y-6">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Visual Template</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={getTemplatePreviewClass('classic')} onClick={() => setConfig({...config, template: 'classic'})}>
                                        Classic Blue
                                    </div>
                                    <div className={getTemplatePreviewClass('modern')} onClick={() => setConfig({...config, template: 'modern'})}>
                                        Modern Slate
                                    </div>
                                    <div className={getTemplatePreviewClass('corporate')} onClick={() => setConfig({...config, template: 'corporate'})}>
                                        Corporate
                                    </div>
                                    <div className={getTemplatePreviewClass('dark')} onClick={() => setConfig({...config, template: 'dark'})}>
                                        Dark Mode
                                    </div>
                                </div>
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Title Slide Image (Optional)</label>
                                {!config.titleImage ? (
                                    <div 
                                        onClick={() => titleImageInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <ImageIcon size={18} />
                                            <span className="text-sm">Upload Cover Image</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 flex items-center justify-center group">
                                        <img src={config.titleImage} alt="Cover" className="h-full w-full object-cover opacity-80" />
                                        <button 
                                            onClick={removeTitleImage}
                                            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={titleImageInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleTitleImageUpload}
                                />
                             </div>
                        </div>

                        {/* Column 2: Content Config */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                                <select 
                                    value={config.audience}
                                    onChange={(e) => setConfig({...config, audience: e.target.value as any})}
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                >
                                    <option value="academic">Academic / Technical</option>
                                    <option value="general">General Public</option>
                                    <option value="executive">Executive Summary</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Length & Detail</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <select 
                                        value={config.numSlides}
                                        onChange={(e) => setConfig({...config, numSlides: parseInt(e.target.value)})}
                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                    >
                                        <option value={5}>Short (5 Slides)</option>
                                        <option value={8}>Standard (8 Slides)</option>
                                        <option value={12}>Detailed (12 Slides)</option>
                                    </select>
                                    <select 
                                        value={config.detailLevel}
                                        onChange={(e) => setConfig({...config, detailLevel: e.target.value as any})}
                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                                    >
                                        <option value="brief">Brief</option>
                                        <option value="detailed">Detailed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="mt-8 flex justify-end">
                        <button
                          onClick={handleGenerate}
                          disabled={status === AppStatus.GENERATING_CONTENT}
                          className={`flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {status === AppStatus.GENERATING_CONTENT ? (
                            <>
                              <Loader2 className="animate-spin h-5 w-5" />
                              <span>Analysing Document...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              <span>Generate Presentation</span>
                            </>
                          )}
                        </button>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        ) : (
          // Results Section
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                  Presentation Ready
                </h2>
                <p className="text-slate-500 mt-1">Review your slides. Add images to specific slides below.</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-4">
                 <button
                  onClick={resetApp}
                  className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Create New
                </button>
                <button
                  onClick={handleDownload}
                  disabled={status === AppStatus.GENERATING_PPT}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {status === AppStatus.GENERATING_PPT ? (
                     <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                     <Download className="h-4 w-4" />
                  )}
                  <span>Download .PPTX</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Title Slide Preview */}
              <div className={`col-span-1 md:col-span-2 lg:col-span-3 rounded-xl p-8 shadow-lg relative overflow-hidden flex ${presentationData.titleImage ? 'flex-row' : 'flex-col text-center'}`}
                style={{
                   backgroundColor: presentationData.template === 'dark' ? '#111827' : presentationData.template === 'corporate' ? '#059669' : '#2563EB',
                   color: 'white'
                }}
              >
                {!presentationData.titleImage && (
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white rounded-full opacity-10 blur-3xl"></div>
                )}
                
                <div className={`relative z-10 py-8 ${presentationData.titleImage ? 'w-1/2 pr-8' : 'w-full'}`}>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{presentationData.title}</h1>
                  {presentationData.subtitle && (
                    <p className="text-xl opacity-90">{presentationData.subtitle}</p>
                  )}
                </div>

                {presentationData.titleImage && (
                    <div className="w-1/2 relative z-10 h-64 rounded-lg overflow-hidden border-4 border-white/20 shadow-md">
                        <img src={presentationData.titleImage} alt="Title" className="w-full h-full object-cover" />
                    </div>
                )}
              </div>

              {/* Individual Slide Cards */}
              {presentationData.slides.map((slide, index) => (
                <SlidePreview 
                    key={index} 
                    slide={slide} 
                    index={index} 
                    template={presentationData.template || 'classic'} 
                    onUpdateImage={(file) => handleUpdateSlideImage(index, file)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Research2PPT. Built with Gemini API & React.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
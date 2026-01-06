import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { UploadedImage } from './types';
import { generateStickers, upscaleImage, generateComic } from './services/geminiService';

// Logic unchanged
const addWatermark = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Không thể lấy context của canvas'));
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const watermarkText = '@yuriifox';
            const fontSize = Math.max(14, Math.floor(img.width / 40));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            const padding = Math.max(8, Math.floor(img.width / 100));
            const textMetrics = ctx.measureText(watermarkText);
            const textHeight = fontSize;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
                canvas.width - textMetrics.width - padding * 2,
                canvas.height - textHeight - padding * 2,
                textMetrics.width + padding * 2,
                textHeight + padding * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
            console.error("Lỗi khi tải ảnh để thêm watermark:", err);
            reject(new Error('Không thể tải ảnh để thêm watermark.'));
        };
        img.src = dataUrl;
    });
};

// --- ICONS ---
const UploadIcon: React.FC = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-white/40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
  </svg>
);
const SparklesIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /> </svg> );
const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /> </svg> );
const TrashIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.244 2.244 0 0 1-2.244 2.077H8.084a2.244 2.244 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg> );
const UndoIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /> </svg> );
const DownloadIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /> </svg> );
const PlusIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg> );
const CloseIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /> </svg> );
const PencilIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /> </svg> );
const UpscaleIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m4.5 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /> </svg> );
const RectangleStackIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" /> </svg> );
const ExclamationTriangleIcon: React.FC<{className?: string}> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /> </svg> );

const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex flex-col justify-center items-center z-[100]">
        <div className="relative">
            <div className="w-24 h-24 border-4 border-white/5 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
        </div>
        <p className="text-white text-2xl mt-8 font-bold tracking-tight">AI đang sáng tạo...</p>
        <p className="text-white/50 mt-2 font-medium">Vui lòng đợi trong giây lát</p>
    </div>
);

interface DropzoneProps {
    onFileSelect: (image: UploadedImage) => void;
    uploadedImage: UploadedImage | null;
    onClear: () => void;
    helpText: string;
    disabled?: boolean;
    compact?: boolean;
    onPaste?: (e: React.ClipboardEvent) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, uploadedImage, onClear, helpText, disabled = false, compact = false, onPaste }) => {
    const [status, setStatus] = useState<'idle' | 'dragging' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileProcessing = (file: File | undefined | null) => {
        if (!file) return;
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Tệp không hợp lệ.');
            setStatus('error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            onFileSelect({ base64: base64String, mimeType: file.type, dataURL: reader.result as string });
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        };
        reader.readAsDataURL(file);
    };

    const dropzoneClasses = `relative flex items-center justify-center w-full h-full glass-input rounded-3xl overflow-hidden transition-all duration-500 outline-none focus:ring-2 focus:ring-purple-500/50 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'
    } ${status === 'dragging' ? 'scale-[0.98] border-purple-500/50 bg-white/10' : ''}`;

    return (
        <div 
            className={dropzoneClasses}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && !uploadedImage && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setStatus('dragging'); }}
            onDragLeave={() => setStatus('idle')}
            onDrop={(e) => { e.preventDefault(); setStatus('idle'); handleFileProcessing(e.dataTransfer.files?.[0]); }}
            onPaste={onPaste}
        >
            {uploadedImage ? (
                <>
                    <img src={uploadedImage.dataURL} className="w-full h-full object-cover" alt="Preview" />
                    <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-red-500 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </>
            ) : (
                <div className="p-4 flex flex-col items-center">
                    {compact ? <PlusIcon className="w-6 h-6 text-white/40" /> : <UploadIcon />}
                    {!compact && <p className="text-white/60 text-[10px] text-center font-bold mt-2 uppercase tracking-tight leading-tight">{helpText}</p>}
                </div>
            )}
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileProcessing(e.target.files?.[0])} className="hidden" accept="image/*" />
        </div>
    );
}

interface ComicCanvasProps {
    frames: { x: number, y: number, w: number, h: number }[];
    setFrames: (frames: { x: number, y: number, w: number, h: number }[]) => void;
    aspectRatio: '1:1' | '16:9' | '9:16';
    onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const ComicCanvas: React.FC<ComicCanvasProps> = ({ frames, setFrames, aspectRatio, onCanvasReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [history, setHistory] = useState<{ x: number, y: number, w: number, h: number }[][]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentFrame, setCurrentFrame] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [activeHandle, setActiveHandle] = useState<string | null>(null);
    const [snapLines, setSnapLines] = useState<{ vertical: number[], horizontal: number[] }>({ vertical: [], horizontal: [] });

    const HANDLE_SIZE = 10;
    const safeFrames = Array.isArray(frames) ? frames : [];
    
    const getDimensions = () => {
        const baseWidth = 400;
        if (aspectRatio === '1:1') return { width: baseWidth, height: baseWidth };
        if (aspectRatio === '16:9') return { width: baseWidth, height: Math.round(baseWidth * 9 / 16) };
        if (aspectRatio === '9:16') return { width: Math.round(baseWidth * 9 / 16), height: baseWidth };
        return { width: baseWidth, height: baseWidth };
    };
    const { width, height } = getDimensions();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex !== null && (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Escape')) {
                const newFrames = safeFrames.filter((_, i) => i !== selectedIndex);
                saveToHistory();
                setFrames(newFrames);
                setSelectedIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, safeFrames]);

    useEffect(() => {
        if (canvasRef.current) {
            onCanvasReady(canvasRef.current);
            draw();
        }
    }, [frames, currentFrame, width, height, snapLines, selectedIndex]);

    const saveToHistory = () => {
        setHistory(prev => [...prev, [...safeFrames]].slice(-20));
    };

    const handleUndo = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(prevH => prevH.slice(0, -1));
            setFrames(prev);
            setSelectedIndex(null);
        }
    };

    const handleClearAll = () => {
        if (safeFrames.length > 0) {
            saveToHistory();
            setFrames([]);
            setSelectedIndex(null);
        }
    };

    const getHandles = (x: number, y: number, w: number, h: number) => ({
        tl: { x: x - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'nw-resize' },
        tr: { x: x + w - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'ne-resize' },
        br: { x: x + w - HANDLE_SIZE/2, y: y + h - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'se-resize' },
        bl: { x: x - HANDLE_SIZE/2, y: y + h - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'sw-resize' },
        t:  { x: x + w/2 - HANDLE_SIZE/2, y: y - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'n-resize' },
        b:  { x: x + w/2 - HANDLE_SIZE/2, y: y + h - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 's-resize' },
        l:  { x: x - HANDLE_SIZE/2, y: y + h/2 - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'w-resize' },
        r:  { x: x + w - HANDLE_SIZE/2, y: y + h/2 - HANDLE_SIZE/2, w: HANDLE_SIZE, h: HANDLE_SIZE, cursor: 'e-resize' }
    });

    const draw = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        safeFrames.forEach((f, i) => {
            if (!f) return;
            ctx.lineWidth = 3;
            ctx.strokeStyle = i === selectedIndex ? '#6366f1' : '#000000';
            ctx.strokeRect(f.x, f.y, f.w, f.h);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText((i + 1).toString(), f.x + 5, f.y + 5);
            if (i === selectedIndex) {
                const hls = getHandles(f.x, f.y, f.w, f.h);
                Object.values(hls).forEach(h => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(h.x, h.y, h.w, h.h);
                    ctx.strokeRect(h.x, h.y, h.w, h.h);
                });
            }
        });
        if (currentFrame) {
            ctx.strokeStyle = '#6366f1';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(currentFrame.x, currentFrame.y, currentFrame.w, currentFrame.h);
            ctx.setLineDash([]);
        }
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = 1;
        snapLines.vertical.forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); });
        snapLines.horizontal.forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const r = canvasRef.current?.getBoundingClientRect(); if (!r) return;
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (selectedIndex !== null && safeFrames[selectedIndex]) {
            const hls = getHandles(safeFrames[selectedIndex].x, safeFrames[selectedIndex].y, safeFrames[selectedIndex].w, safeFrames[selectedIndex].h);
            for (const [k, h] of Object.entries(hls)) { if (x >= h.x && x <= h.x+h.w && y >= h.y && y <= h.y+h.h) { setActiveHandle(k); saveToHistory(); return; } }
        }
        let found = -1;
        for (let i = safeFrames.length-1; i>=0; i--) { if (safeFrames[i] && x >= safeFrames[i].x && x <= safeFrames[i].x+safeFrames[i].w && y >= safeFrames[i].y && y <= safeFrames[i].y+safeFrames[i].h) { found = i; break; } }
        if (found !== -1) { setSelectedIndex(found); } else { setSelectedIndex(null); setStartPos({x, y}); setIsDrawing(true); saveToHistory(); }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const r = canvasRef.current?.getBoundingClientRect(); if (!r) return;
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (!isDrawing && !activeHandle) return;
        const SNAP = 10;
        let sx = x, sy = y;
        const vSnaps = [0, width, width/2], hSnaps = [0, height, height/2];
        safeFrames.forEach((f, i) => { if (i !== selectedIndex && f) { vSnaps.push(f.x, f.x+f.w); hSnaps.push(f.y, f.y+f.h); } });
        let dv = SNAP, dh = SNAP, vs = [], hs = [];
        vSnaps.forEach(t => { if (Math.abs(x-t) < dv) { dv = Math.abs(x-t); sx = t; vs = [t]; } });
        hSnaps.forEach(t => { if (Math.abs(y-t) < dh) { dh = Math.abs(y-t); sy = t; hs = [t]; } });
        setSnapLines({ vertical: vs, horizontal: hs });
        if (isDrawing) { setCurrentFrame({ x: startPos.x, y: startPos.y, w: sx - startPos.x, h: sy - startPos.y }); }
        else if (activeHandle && selectedIndex !== null) {
            const f = safeFrames[selectedIndex];
            if (!f) return;
            let nx = f.x, ny = f.y, nw = f.w, nh = f.h;
            if (activeHandle.includes('l')) { nx = sx; nw = f.w + (f.x - sx); }
            if (activeHandle.includes('r')) { nw = sx - f.x; }
            if (activeHandle.includes('t')) { ny = sy; nh = f.h + (f.y - sy); }
            if (activeHandle.includes('b')) { nh = sy - f.y; }
            const nfs = [...safeFrames]; nfs[selectedIndex] = { x: nx, y: ny, w: nw, h: nh }; setFrames(nfs);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false); setActiveHandle(null); setSnapLines({ vertical: [], horizontal: [] });
        if (currentFrame) {
            let {x, y, w, h} = currentFrame;
            if (w < 0) { x += w; w = Math.abs(w); } if (h < 0) { y += h; y = Math.abs(h); }
            if (w > 10 && h > 10) setFrames([...safeFrames, {x, y, w, h}]);
            setCurrentFrame(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={handleUndo} disabled={history.length === 0} className={`p-2 rounded-xl backdrop-blur-xl border border-white/10 text-white transition-all haptic-button ${history.length === 0 ? 'opacity-20 grayscale' : 'bg-white/10 hover:bg-white/20'}`}>
                    <UndoIcon className="w-5 h-5" />
                </button>
                <button onClick={handleClearAll} disabled={safeFrames.length === 0} className={`p-2 rounded-xl backdrop-blur-xl border border-white/10 text-white transition-all haptic-button ${safeFrames.length === 0 ? 'opacity-20 grayscale' : 'bg-red-500/20 hover:bg-red-500/40'}`}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="bg-white p-2 rounded-2xl shadow-2xl border border-white/10 ring-1 ring-black/5">
                <canvas ref={canvasRef} width={width} height={height} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="rounded-lg cursor-crosshair" />
            </div>
        </div>
    );
};

const emotions = [ { emoji: '😀', label: 'Vui vẻ' }, { emoji: '😂', label: 'Cười lớn' }, { emoji: '😍', label: 'Yêu thích' }, { emoji: '😎', label: 'Ngầu' }, { emoji: '🤔', label: 'Suy tư' }, { emoji: '😮', label: 'Ngạc nhiên' }, { emoji: '😢', label: 'Buồn' }, { emoji: '😠', label: 'Tức giận' }, { emoji: '😜', label: 'Trêu chọc' }, { emoji: '😭', label: 'Khóc lóc' }, { emoji: '😴', label: 'Buồn ngủ' }, { emoji: '😱', label: 'Hoảng sợ' }, { emoji: '😳', label: 'Bối rối' }, { emoji: '🥳', label: 'Ăn mừng' }, { emoji: '🥺', label: 'Năn nỉ' }, { emoji: '🤯', label: 'Sốc' }, ];
const bodyOptions = ['Đầu', 'Nửa người', 'Toàn thân', 'Posing', 'Đổi trang phục', 'Chuyển hóa', 'Phân rã', 'Infographic Char'];
const bodyOptionDescriptions: Record<string, string> = { 'Đầu': 'Tạo ảnh chân dung chỉ lấy phần đầu.', 'Nửa người': 'Tạo ảnh bán thân từ thắt lưng trở lên.', 'Toàn thân': 'Tạo ảnh đầy đủ toàn bộ cơ thể.', 'Posing': 'Lấy tư thế từ ảnh 2 cho nhân vật chính.', 'Đổi trang phục': 'Lấy trang phục từ ảnh 2 cho nhân vật chính.', 'Chuyển hóa': 'Thay đổi phụ kiện nv2 theo nv1.', 'Phân rã': 'Bản thiết kế chi tiết (concept sheet).', 'Infographic Char': 'Phân tích kỹ năng và hành trang.' };
const styleOptions = ['Mặc định', '3D Pixar'];

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'sticker' | 'manga'>('sticker');
    const [userCount, setUserCount] = useState<number>(0);
    const [avatarIds, setAvatarIds] = useState<number[]>([]);
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [secondaryImage, setSecondaryImage] = useState<UploadedImage | null>(null);
    const [exampleImage, setExampleImage] = useState<UploadedImage | null>(null);
    const [prompt, setPrompt] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState<string[]>([]);
    const [emotionIntensity, setEmotionIntensity] = useState(1);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isEmotionsExpanded, setIsEmotionsExpanded] = useState(false);
    const [selectedBody, setSelectedBody] = useState('Toàn thân');
    const [selectedStyle, setSelectedStyle] = useState('Mặc định');
    const [isManipulationEnabled, setIsManipulationEnabled] = useState(false);
    const [generatedStickers, setGeneratedStickers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewedSticker, setPreviewedSticker] = useState<{ url: string; index: number } | null>(null);
    
    // Manga Maker State
    const [comicFrames, setComicFrames] = useState<{ x: number, y: number, w: number, h: number }[]>([]);
    const [panelData, setPanelData] = useState<{ prompt: string; example: UploadedImage | null }[]>([]);
    const [comicRatio, setComicRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
    const [comicCharacters, setComicCharacters] = useState<UploadedImage[]>([]);
    const [generatedComic, setGeneratedComic] = useState<string | null>(null);
    const comicCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Refs for state values to avoid stale closures in global event listeners
    const stateRef = useRef({ uploadedImage, secondaryImage, exampleImage, activeTab, panelData });
    useEffect(() => {
        stateRef.current = { uploadedImage, secondaryImage, exampleImage, activeTab, panelData };
    }, [uploadedImage, secondaryImage, exampleImage, activeTab, panelData]);

    useEffect(() => {
        setUserCount(70 + Math.floor(Math.random() * 50));
        setAvatarIds(Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)));
    }, []);

    const processPasteItem = (item: DataTransferItem): Promise<UploadedImage | null> => {
        return new Promise((resolve) => {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const dataURL = e.target?.result as string;
                        resolve({
                            base64: dataURL.split(',')[1],
                            mimeType: blob.type,
                            dataURL
                        });
                    };
                    reader.readAsDataURL(blob);
                } else resolve(null);
            } else resolve(null);
        });
    };

    const handleAutoRoutePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items || stateRef.current.activeTab !== 'sticker') return;
        
        for (let i = 0; i < items.length; i++) {
            const img = await processPasteItem(items[i]);
            if (img) {
                e.preventDefault();
                // Logic Routing: NV Chính -> NV Phụ -> Ví Dụ
                if (!stateRef.current.uploadedImage) {
                    setUploadedImage(img);
                } else if (!stateRef.current.secondaryImage) {
                    setSecondaryImage(img);
                } else {
                    setExampleImage(img);
                }
                break;
            }
        }
    };

    useEffect(() => {
        window.addEventListener('paste', handleAutoRoutePaste);
        return () => window.removeEventListener('paste', handleAutoRoutePaste);
    }, []);

    const handlePaste = async (e: React.ClipboardEvent, target: 'main' | 'secondary' | 'example' | number) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            const img = await processPasteItem(items[i]);
            if (img) {
                e.preventDefault();
                e.stopPropagation(); // Ngăn sự kiện nổi lên xử lý auto-routing toàn cục
                if (target === 'main') setUploadedImage(img);
                else if (target === 'secondary') setSecondaryImage(img);
                else if (target === 'example') setExampleImage(img);
                else if (typeof target === 'number') {
                    const n = [...panelData];
                    if (n[target]) {
                        n[target].example = img;
                        setPanelData(n);
                    }
                }
                break;
            }
        }
    };

    const handleGenerateClick = useCallback(async () => {
        if (!uploadedImage) { setError('Vui lòng tải ảnh chính.'); return; }
        setIsLoading(true); setError(null);
        try {
            let advancedAdditions = [];
            if (selectedBody !== 'Toàn thân') advancedAdditions.push(bodyOptionDescriptions[selectedBody] || selectedBody);
            if (selectedStyle !== 'Mặc định') advancedAdditions.push(`phong cách ${selectedStyle}`);
            if (isManipulationEnabled) advancedAdditions.push('thêm dây múa rối');
            if (emotionIntensity > 1) advancedAdditions.push(`mức độ biểu cảm ${emotionIntensity}/10`);
            const finalRequest = [prompt, ...selectedEmotion, ...advancedAdditions].filter(Boolean).join(', ');
            const stickerArrays = await generateStickers(uploadedImage.base64, uploadedImage.mimeType, finalRequest, secondaryImage?.base64, secondaryImage?.mimeType, exampleImage?.base64, exampleImage?.mimeType);
            const watermarked = await Promise.all(stickerArrays.map(s => addWatermark(s)));
            setGeneratedStickers(prev => [...watermarked, ...prev]);
        } catch (e) { setError('Lỗi khi tạo ảnh.'); } finally { setIsLoading(false); }
    }, [uploadedImage, secondaryImage, exampleImage, prompt, selectedEmotion, selectedBody, selectedStyle, isManipulationEnabled, emotionIntensity]);

    const handleGenerateComic = async () => {
        if (comicFrames.length === 0 || comicCharacters.length === 0) { setError('Thiếu thông tin tạo truyện.'); return; }
        setIsLoading(true); setError(null);
        try {
            const baseWidth = 400;
            let canvasW = baseWidth, canvasH = baseWidth;
            if (comicRatio === '16:9') canvasH = Math.round(baseWidth * 9 / 16);
            if (comicRatio === '9:16') { canvasW = Math.round(baseWidth * 9 / 16); canvasH = baseWidth; }
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasW; tempCanvas.height = canvasH;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = '#ffffff'; tempCtx.fillRect(0, 0, canvasW, canvasH);
                tempCtx.strokeStyle = '#000000'; tempCtx.lineWidth = 3;
                comicFrames.forEach(f => { tempCtx.strokeRect(f.x, f.y, f.w, f.h); });
            }
            const cleanLayoutDataUrl = tempCanvas.toDataURL('image/png');
            const result = await generateComic(panelData, { base64: cleanLayoutDataUrl.split(',')[1], mimeType: 'image/png', dataURL: cleanLayoutDataUrl }, comicCharacters.filter(c => c.base64), comicRatio);
            if (result) {
                const wm = await addWatermark(result);
                setGeneratedComic(wm);
            }
        } catch (e) { setError('Lỗi khi tạo truyện.'); } finally { setIsLoading(false); }
    };

    const handleEditResult = (dataURL: string) => {
        const mimeType = dataURL.split(':')[1].split(';')[0];
        const base64 = dataURL.split(',')[1];
        setUploadedImage({ base64, mimeType, dataURL });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpscaleResult = async (dataURL: string, type: 'sticker' | 'comic') => {
        setIsLoading(true);
        try {
            const mimeType = dataURL.split(':')[1].split(';')[0];
            const base64 = dataURL.split(',')[1];
            const upscaled = await upscaleImage({ base64, mimeType, dataURL });
            if (upscaled) {
                const watermarked = await addWatermark(upscaled.dataURL);
                if (type === 'sticker') setGeneratedStickers(prev => prev.map(s => s === dataURL ? watermarked : s));
                else setGeneratedComic(watermarked);
            }
        } catch (e) { setError('Lỗi khi nâng cấp ảnh.'); } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen text-white p-4 sm:p-8">
            {isLoading && <LoadingOverlay />}
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 glass-card px-4 py-2 rounded-full mb-6">
                        <div className="flex -space-x-2">
                            {avatarIds.map(id => <img key={id} className="w-6 h-6 rounded-full border border-white/20" src={`https://avatar.iran.liara.run/public/${id}`} alt="" />)}
                        </div>
                        <p className="text-xs font-semibold text-white/70">
                            <span className="text-green-400">●</span> {userCount} người đang online
                        </p>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 text-transparent bg-clip-text mb-4">AI Image Studio</h1>
                    <p className="text-white/40 font-medium tracking-widest uppercase text-xs">By @yuriifox</p>
                </header>

                <nav className="flex justify-center mb-12">
                    <div className="glass-card p-1.5 rounded-full flex gap-1">
                        <button onClick={() => setActiveTab('sticker')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'sticker' ? 'bg-white text-black shadow-xl' : 'text-white/50 hover:text-white'}`}>Sticker Studio</button>
                        <button onClick={() => setActiveTab('manga')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'manga' ? 'bg-white text-black shadow-xl' : 'text-white/50 hover:text-white'}`}>Manga Maker</button>
                    </div>
                </nav>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <section className="lg:col-span-5 glass-card rounded-[40px] p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {activeTab === 'sticker' ? (
                            <>
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> 1. Nhập liệu</h2>
                                    <div className="grid grid-cols-3 gap-3 h-32">
                                        <Dropzone onFileSelect={setUploadedImage} uploadedImage={uploadedImage} onClear={() => setUploadedImage(null)} helpText="NV Chính" onPaste={(e) => handlePaste(e, 'main')} />
                                        <Dropzone onFileSelect={setSecondaryImage} uploadedImage={secondaryImage} onClear={() => setSecondaryImage(null)} helpText="NV Phụ" onPaste={(e) => handlePaste(e, 'secondary')} />
                                        <Dropzone onFileSelect={setExampleImage} uploadedImage={exampleImage} onClear={() => setExampleImage(null)} helpText="Ảnh Ví Dụ" compact onPaste={(e) => handlePaste(e, 'example')} />
                                    </div>
                                    <p className="text-[10px] text-white/30 italic">Mẹo: Nhấn Ctrl+V để dán ảnh. Ảnh tự động vào ô trống theo thứ tự Chính -> Phụ -> Ví Dụ.</p>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500"></div> 2. Biểu cảm</h2>
                                    <div className="flex items-center gap-2 p-1 overflow-x-auto no-scrollbar">
                                        {emotions.slice(0, 6).map(e => (
                                            <button key={e.label} onClick={() => setSelectedEmotion(prev => prev.includes(e.label) ? prev.filter(x => x !== e.label) : [...prev, e.label])} className={`w-10 h-10 flex-shrink-0 rounded-xl text-lg flex items-center justify-center transition-all ${selectedEmotion.includes(e.label) ? 'bg-white text-black scale-90' : 'glass-input hover:bg-white/5'}`}>
                                                {e.emoji}
                                            </button>
                                        ))}
                                        <button onClick={() => setIsEmotionsExpanded(!isEmotionsExpanded)} className="w-10 h-10 flex-shrink-0 rounded-xl glass-input flex items-center justify-center text-white/40 hover:text-white transition-all">
                                            <PlusIcon className={`w-5 h-5 transition-transform duration-300 ${isEmotionsExpanded ? 'rotate-45' : ''}`} />
                                        </button>
                                    </div>
                                    {isEmotionsExpanded && (
                                        <div className="grid grid-cols-6 gap-2 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                                            {emotions.slice(6).map(e => (
                                                <button key={e.label} onClick={() => setSelectedEmotion(prev => prev.includes(e.label) ? prev.filter(x => x !== e.label) : [...prev, e.label])} className={`w-full aspect-square rounded-xl text-lg flex items-center justify-center transition-all ${selectedEmotion.includes(e.label) ? 'bg-white text-black scale-90' : 'glass-input hover:bg-white/5'}`}>
                                                    {e.emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex justify-between items-center p-4 glass-input rounded-2xl text-white/80 hover:text-white transition-all" disabled={!uploadedImage}>
                                        <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Tùy chọn nâng cao</span>
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180 text-blue-400' : ''}`} />
                                    </button>
                                    {isAdvancedOpen && (
                                        <div className="space-y-6 p-6 glass-card rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div>
                                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Thao túng</h4>
                                                <label className="relative inline-flex items-center cursor-pointer group">
                                                    <input type="checkbox" className="sr-only peer" checked={isManipulationEnabled} onChange={() => setIsManipulationEnabled(!isManipulationEnabled)} />
                                                    <div className="w-12 h-6 bg-white/5 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-lg"></div>
                                                    <span className="ml-3 text-sm font-medium text-white/60 group-hover:text-white transition-colors">Dây múa rối</span>
                                                </label>
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-3"><h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Cường độ biểu cảm</h4><span className="text-xs font-bold text-blue-400">{emotionIntensity}/10</span></div>
                                                <input type="range" min="1" max="10" step="1" value={emotionIntensity} onChange={(e) => setEmotionIntensity(Number(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Phạm vi</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {bodyOptions.map(option => (
                                                        <button key={option} onClick={() => setSelectedBody(option)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedBody === option ? 'bg-blue-600 text-white shadow-lg' : 'glass-input text-white/50 hover:text-white'}`}>{option}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Phong cách</h4>
                                                <div className="flex gap-2">
                                                    {styleOptions.map(option => (
                                                        <button key={option} onClick={() => setSelectedStyle(option)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedStyle === option ? 'bg-blue-600 text-white shadow-lg' : 'glass-input text-white/50 hover:text-white'}`}>{option}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onPaste={(e) => handlePaste(e, 'example')} placeholder="Nhập yêu cầu tùy chỉnh... (Dán ảnh Ctrl+V bất cứ đâu để tự động thêm ảnh)" className="w-full h-32 glass-input rounded-3xl p-6 text-white placeholder-white/20 outline-none resize-none focus:ring-2 focus:ring-purple-500/20" />
                                </div>
                                <button onClick={handleGenerateClick} className="w-full py-6 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] haptic-button">Bắt đầu tạo ảnh</button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> 1. Layout</h2>
                                    <div className="flex gap-2">
                                        {['1:1', '16:9', '9:16'].map(r => (
                                            <button key={r} onClick={() => { setComicRatio(r as any); setComicFrames([]); }} className={`flex-1 py-3 rounded-2xl text-sm font-bold border ${comicRatio === r ? 'bg-white text-black' : 'border-white/10 hover:bg-white/5'}`}>{r}</button>
                                        ))}
                                    </div>
                                    <ComicCanvas frames={comicFrames} setFrames={setComicFrames} aspectRatio={comicRatio} onCanvasReady={c => comicCanvasRef.current = c} />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500"></div> 2. Nhân vật</h2>
                                    <div className="grid grid-cols-4 gap-2">
                                        {comicCharacters.map((c, i) => (
                                            <div key={i} className="relative group h-16">
                                                <div className="absolute -top-2 -left-2 z-20 px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold text-white shadow-xl">nv{i + 1}</div>
                                                <Dropzone compact onFileSelect={img => { const n = [...comicCharacters]; n[i] = img; setComicCharacters(n); }} uploadedImage={c.base64 ? c : null} onClear={() => { const n = [...comicCharacters]; n[i] = {base64:'',mimeType:'',dataURL:''}; setComicCharacters(n); }} helpText="" />
                                            </div>
                                        ))}
                                        <button onClick={() => setComicCharacters([...comicCharacters, {base64:'',mimeType:'',dataURL:''}])} className="h-16 glass-input rounded-2xl flex items-center justify-center text-white/20 hover:text-white/60 transition-colors"><PlusIcon className="w-6 h-6" /></button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 3. Nội dung</h2>
                                    <div className="space-y-4">
                                        {comicFrames.length === 0 ? <p className="text-center text-white/20 italic text-sm py-4">Hãy vẽ khung trên canvas để nhập nội dung.</p> : panelData.map((data, i) => (
                                            <div key={i} className="flex gap-3 items-start glass-input p-4 rounded-3xl border-white/5">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Khung {i + 1}</label>
                                                    <textarea value={data.prompt} onPaste={(e) => handlePaste(e, i)} onChange={e => { const n = [...panelData]; n[i].prompt = e.target.value; setPanelData(n); }} placeholder="Mô tả hoặc dán ảnh ví dụ..." className="w-full h-20 bg-white/5 border border-white/5 rounded-2xl p-3 text-white placeholder-white/10 text-sm outline-none focus:border-white/20" />
                                                </div>
                                                <div className="w-20 h-20 flex-shrink-0 mt-6"><Dropzone compact uploadedImage={data.example} onFileSelect={img => { const n = [...panelData]; n[i].example = img; setPanelData(n); }} onClear={() => { const n = [...panelData]; n[i].example = null; setPanelData(n); }} helpText="" onPaste={(e) => handlePaste(e, i)} /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleGenerateComic} className="w-full py-6 rounded-3xl bg-white text-black font-bold text-xl shadow-2xl haptic-button">Xuất trang truyện</button>
                            </>
                        )}
                        {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"><ExclamationTriangleIcon className="w-5 h-5" /> {error}</div>}
                    </section>

                    <section className="lg:col-span-7 space-y-6">
                        <div className="flex justify-between items-center px-4"><h2 className="text-2xl font-bold tracking-tight">Kết quả</h2></div>
                        <div className="glass-card rounded-[40px] p-8 min-h-[600px] flex flex-col">
                            {activeTab === 'sticker' ? (
                                generatedStickers.length === 0 ? <div className="flex-grow flex flex-col items-center justify-center text-white/10 space-y-4"><SparklesIcon className="w-24 h-24" /><p className="text-lg font-bold uppercase tracking-widest">Trống</p></div> : (
                                    <div className="grid grid-cols-2 gap-6">
                                        {generatedStickers.map((s, i) => (
                                            <div key={i} className="group relative glass-card rounded-3xl overflow-hidden aspect-square transition-all hover:scale-[1.02] hover:shadow-2xl">
                                                <img src={s} className="w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button onClick={() => { const l = document.createElement('a'); l.href = s; l.download = 'art.png'; l.click(); }} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"><DownloadIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => handleEditResult(s)} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"><PencilIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => handleUpscaleResult(s, 'sticker')} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"><UpscaleIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => setPreviewedSticker({url:s, index:i})} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"><SparklesIcon className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                !generatedComic ? <div className="flex-grow flex flex-col items-center justify-center text-white/10 space-y-4"><RectangleStackIcon className="w-24 h-24" /><p className="text-lg font-bold uppercase tracking-widest">Chưa có truyện</p></div> : (
                                    <div className="space-y-6">
                                        <div className="group relative">
                                            <img src={generatedComic} className="w-full rounded-3xl border border-white/10 shadow-2xl" alt="" />
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleUpscaleResult(generatedComic, 'comic')} className="p-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white hover:text-black transition-all"><UpscaleIcon className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => { const l = document.createElement('a'); l.href = generatedComic; l.download = 'comic.png'; l.click(); }} className="py-4 glass-input rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"><DownloadIcon className="w-5 h-5" /> Tải xuống</button>
                                            <button onClick={() => handleEditResult(generatedComic)} className="py-4 glass-input rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"><PencilIcon className="w-5 h-5" /> Chỉnh sửa</button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                </main>
            </div>

            {previewedSticker && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-8" onClick={() => setPreviewedSticker(null)}>
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <img src={previewedSticker.url} className="w-full rounded-[40px] shadow-2xl border border-white/20" alt="" />
                        <div className="absolute -top-14 right-0 flex gap-4">
                            <button onClick={() => { const l = document.createElement('a'); l.href = previewedSticker.url; l.download = 'art.png'; l.click(); }} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white hover:text-black transition-all"><DownloadIcon className="w-6 h-6" /></button>
                            <button onClick={() => setPreviewedSticker(null)} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:text-red-500 transition-all"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
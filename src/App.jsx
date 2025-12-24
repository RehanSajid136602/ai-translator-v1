import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ArrowRightLeft, Mic, Volume2, X, Copy, Star, Share2,
  Info, CheckCircle, AlertCircle, FileText, Download
} from 'lucide-react';
import './index.css';
import './components/SettingsModal.css';
import Header from './components/Header';
import AudioVisualizer from './components/AudioVisualizer';
import HistoryPanel from './components/HistoryPanel';
import SettingsModal from './components/SettingsModal';
import { LANGUAGES } from './constants/languages';

const LanguageSelector = ({ langCode, isOpen, onToggle, onSelect, search, onSearch }) => {
  const selectedLang = LANGUAGES.find(l => l.code === langCode);
  return (
    <div className="lang-select-wrapper">
      <button className="lang-select-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <span className="flex items-center gap-2">
          <span className={`fi fi-${selectedLang?.flag}`}></span>
          <span>{selectedLang?.name}</span>
        </span>
        <ChevronDown size={16} />
      </button>
      <div className={`lang-dropdown ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="lang-search">
          <input 
            type="text" placeholder="Search..." value={search}
            onChange={(e) => onSearch(e.target.value)} autoFocus
          />
        </div>
        <div className="lang-list">
          {LANGUAGES.filter(l => l.name.toLowerCase().includes(search.toLowerCase())).map(lang => (
            <div 
              key={lang.code} className={`lang-option ${lang.code === langCode ? 'selected' : ''}`}
              onClick={() => onSelect(lang.code)}
            >
              <span className={`fi fi-${lang.flag}`}></span>
              <span>{lang.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('translationHistory') || '[]'));
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites') || '[]'));
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [detectedLang, setDetectedLang] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voicePrefs, setVoicePrefs] = useState(() => JSON.parse(localStorage.getItem('voicePrefs') || '{}'));
  const [rate, setRate] = useState(() => parseFloat(localStorage.getItem('ttsRate') || '1.0'));
  const [pitch, setPitch] = useState(() => parseFloat(localStorage.getItem('ttsPitch') || '1.0'));
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [langSearch, setLangSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
  const [cachedTtsMeta, setCachedTtsMeta] = useState({ text: '', lang: '' });

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounce Translation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) translateText();
      else {
        setTranslatedText('');
        setTtsAudioUrl(null);
        setCachedTtsMeta({ text: '', lang: '' });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [text, sourceLang, targetLang]);

  // Pre-fetch Audio
  useEffect(() => {
    if (!translatedText || !targetLang) return;
    setTtsAudioUrl(null);
    const prefetch = async () => {
      try {
        const url = `/api/tts?text=${encodeURIComponent(translatedText)}&lang=${targetLang}`;
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          setTtsAudioUrl(URL.createObjectURL(blob));
          setCachedTtsMeta({ text: translatedText, lang: targetLang });
        }
      } catch (e) {}
    };
    prefetch();
  }, [translatedText, targetLang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('translationHistory', JSON.stringify(history));
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [history, favorites]);

  useEffect(() => {
    localStorage.setItem('voicePrefs', JSON.stringify(voicePrefs));
    localStorage.setItem('ttsRate', rate);
    localStorage.setItem('ttsPitch', pitch);
  }, [voicePrefs, rate, pitch]);

  useEffect(() => {
    const hide = () => setActiveDropdown(null);
    document.addEventListener('click', hide);
    return () => document.removeEventListener('click', hide);
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };

  const translateText = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    try {
      const pair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}&de=text@example.com`, { signal: abortControllerRef.current.signal });
      const data = await res.json();
      if (data.responseStatus === 200) {
        const trans = data.responseData.translatedText;
        setTranslatedText(trans);
        if (sourceLang === 'auto' && data.responseData.detectedSourceLanguage) {
          const detected = data.responseData.detectedSourceLanguage;
          const l = LANGUAGES.find(x => x.code === detected);
          setDetectedLang(l ? l.name : detected);
        }
        setHistory(p => [{ source: text, target: trans, sourceLang: (sourceLang === 'auto' ? (data.responseData.detectedSourceLanguage || 'auto') : sourceLang), targetLang, timestamp: new Date().toISOString() }, ...p].slice(0, 50));
      } else showToast('Translation failed', 'error');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Network Error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (txt, lang) => {
    if (!txt) return;
    window.speechSynthesis.cancel();
    if (window.currentAudio) window.currentAudio.pause();

    if (ttsAudioUrl && cachedTtsMeta.text === txt && cachedTtsMeta.lang === lang) {
      const audio = new Audio(ttsAudioUrl);
      window.currentAudio = audio;
      audio.play().catch(() => nativeFallback(txt, lang));
      return;
    }

    try {
      showToast('Loading Neural Audio...', 'info');
      const res = await fetch(`/api/tts?text=${encodeURIComponent(txt)}&lang=${lang}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      window.currentAudio = audio;
      audio.play().catch(() => nativeFallback(txt, lang));
    } catch (e) {
      nativeFallback(txt, lang);
    }
  };

  const nativeFallback = (txt, lang) => {
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  };

  const toggleRecording = async () => {
    if (!('webkitSpeechRecognition' in window)) return showToast('Not supported', 'error');
    if (isRecording) return recognitionRef.current?.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = sourceLang === 'zh' ? 'zh-CN' : sourceLang;
      rec.continuous = true;
      rec.onstart = () => { setIsRecording(true); showToast('Listening...', 'success'); };
      rec.onresult = (e) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) if (e.results[i].isFinal) t += e.results[i][0].transcript;
        if (t) setText(p => (p ? p + ' ' : '') + t);
      };
      rec.onend = () => { setIsRecording(false); if (audioStream) audioStream.getTracks().forEach(x => x.stop()); };
      recognitionRef.current = rec;
      rec.start();
    } catch (e) { showToast('Mic Denied', 'error'); }
  };

  return (
    <>
      <div className="bg-gradient-orb orb-1"></div><div className="bg-gradient-orb orb-2"></div><div className="bg-gradient-orb orb-3"></div><div className="bg-grain"></div>
      <div className="toast-container">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}</div>
      <Header toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} toggleHistory={() => setIsHistoryOpen(true)} toggleSettings={() => setIsSettingsOpen(true)} theme={theme} />
      <main className="container">
        <div className="translator-grid">
          <div className={`card ${isDragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) { const r = new FileReader(); r.onload = x => setText(x.target.result); r.readAsText(f); } }}>
            <div className="flex justify-between items-center mb-2">
              <LanguageSelector langCode={sourceLang} isOpen={activeDropdown === 'source'} onToggle={() => setActiveDropdown('source')} onSelect={c => { setSourceLang(c); setActiveDropdown(null); }} search={langSearch} onSearch={setLangSearch} />
              {sourceLang === 'auto' && detectedLang && <div className="detected-badge">Detected: {detectedLang}</div>}
            </div>
            <div className="textarea-wrapper"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type or drop .txt file..." spellCheck="false" autoFocus /><AudioVisualizer isRecording={isRecording} stream={audioStream} /></div>
            <div className="card-footer">
              <div className="action-group">
                <button className={`icon-btn mic-btn ${isRecording ? 'listening' : ''}`} onClick={toggleRecording}><div className="mic-waves"></div><Mic size={20} /></button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = x => setText(x.target.result); r.readAsText(f); } }} />
                <button className="icon-btn" onClick={() => fileInputRef.current.click()}><FileText size={20} /></button>
                <button className="icon-btn" onClick={() => speakText(text, sourceLang)}><Volume2 size={20} /></button>
              </div>
              <div className="action-group"><span className="font-mono text-sm opacity-50">{text.length}/5000</span><button className="icon-btn" onClick={() => setText('')}><X size={20} /></button></div>
            </div>
          </div>
          <div className="swap-container"><button className="swap-btn" onClick={() => { setSourceLang(targetLang); setTargetLang(sourceLang); setText(translatedText); setTranslatedText(text); }}><ArrowRightLeft size={20} /></button></div>
          <div className="card">
            {isLoading && <div className="loading-overlay"><div className="loading-spinner"></div></div>}
            <LanguageSelector langCode={targetLang} isOpen={activeDropdown === 'target'} onToggle={() => setActiveDropdown('target')} onSelect={c => { setTargetLang(c); setActiveDropdown(null); }} search={langSearch} onSearch={setLangSearch} />
            <div className="textarea-wrapper"><textarea value={translatedText} readOnly placeholder="Translation" style={{ opacity: isLoading ? 0.7 : 1 }} /></div>
            <div className="card-footer">
              <div className="action-group"><button className="icon-btn" onClick={() => speakText(translatedText, targetLang)}><Volume2 size={20} /></button><button className="icon-btn" onClick={() => { const b = new Blob([translatedText], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'translation.txt'; a.click(); }}><Download size={20} /></button></div>
              <div className="action-group">
                <button className="icon-btn" onClick={() => { navigator.clipboard.writeText(translatedText); showToast('Copied', 'success'); }}><Copy size={20} /></button>
                <button className={`icon-btn ${favorites.some(f => f.source === text) ? 'text-warning' : ''}`} onClick={() => { const isF = favorites.some(f => f.source === text); if (isF) setFavorites(p => p.filter(f => f.source !== text)); else setFavorites(p => [{ source: text, target: translatedText, sourceLang, targetLang, timestamp: new Date().toISOString() }, ...p]); }}><Star size={20} fill={favorites.some(f => f.source === text) ? "currentColor" : "none"} /></button>
                <button className="icon-btn" onClick={() => { if (navigator.share) navigator.share({ title: 'Translation', text: translatedText }); else showToast('Share not supported', 'info'); }}><Share2 size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={i => { setSourceLang(i.sourceLang); setTargetLang(i.targetLang); setText(i.source); setTranslatedText(i.target); setIsHistoryOpen(false); }} onClear={() => setHistory([])} onExport={f => { let c = f === 'json' ? JSON.stringify(history) : history.map(i => `${i.source},${i.target}`).join('\n'); const b = new Blob([c], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `history.${f}`; a.click(); }} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} voicePrefs={voicePrefs} setVoicePrefs={setVoicePrefs} rate={rate} setRate={setRate} pitch={pitch} setPitch={setPitch} currentSourceLang={sourceLang} currentTargetLang={targetLang} />
    </>
  );
}
export default App;

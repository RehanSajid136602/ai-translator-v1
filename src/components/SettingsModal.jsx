import React, { useEffect, useState } from 'react';
import { X, Volume2, Globe } from 'lucide-react';
import { LANGUAGES } from '../constants/languages';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  voicePrefs, 
  setVoicePrefs, 
  rate, 
  setRate, 
  pitch, 
  setPitch,
  currentSourceLang,
  currentTargetLang
}) => {
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  if (!isOpen) return null;

  const getVoicesForLang = (langCode) => {
    // Match 'en', 'es', etc. against 'en-US', 'es-ES'
    return availableVoices.filter(v => v.lang.startsWith(langCode));
  };

  const renderVoiceSelect = (label, langCode) => {
    const voices = getVoicesForLang(langCode);
    const langName = LANGUAGES.find(l => l.code === langCode)?.name || langCode;

    if (voices.length === 0) return (
      <div className="setting-group">
        <label>{label} ({langName})</label>
        <div className="text-sm opacity-60 italic bg-info/10 p-2 rounded border border-info/20">
          No native voices found on your system for this language. 
          The app will automatically use a high-quality Cloud Fallback for speech.
        </div>
      </div>
    );

    return (
      <div className="setting-group">
        <label>{label} ({langName})</label>
        <select 
          value={voicePrefs[langCode] || ''}
          onChange={(e) => setVoicePrefs(prev => ({ ...prev, [langCode]: e.target.value }))}
          className="settings-select"
        >
          <option value="">Default Voice</option>
          {voices.map(voice => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="flex items-center gap-2">
            <SettingsIcon size={24} className="text-accent-primary" /> 
            Settings
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3 className="flex items-center gap-2 text-accent-secondary">
              <Volume2 size={18} /> Text-to-Speech
            </h3>
            
            <div className="range-group">
              <div className="flex justify-between">
                <label>Speed ({rate}x)</label>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              />
            </div>

            <div className="range-group">
              <div className="flex justify-between">
                <label>Pitch ({pitch})</label>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="flex items-center gap-2 text-accent-secondary">
              <Globe size={18} /> Preferred Voices
            </h3>
            <p className="text-sm opacity-70 mb-4">Select preferred voices for your current languages.</p>
            
            {renderVoiceSelect("Source Language", currentSourceLang)}
            {renderVoiceSelect("Target Language", currentTargetLang)}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

// Simple internal icon component if not passed from lucide
const SettingsIcon = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export default SettingsModal;

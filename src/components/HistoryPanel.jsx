import React from 'react';
import { X, Trash2, ArrowRight, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { LANGUAGES } from '../constants/languages';

const HistoryPanel = ({ isOpen, onClose, history, onSelect, onClear, onExport }) => {
  const getLangName = (code) => LANGUAGES.find(l => l.code === code)?.name || code;

  return (
    <aside className={`side-panel ${isOpen ? 'open' : ''}`} id="history-panel">
      <div className="panel-header">
        <div className="flex flex-col gap-1">
          <h3>History</h3>
          <div className="flex gap-2">
            <button 
              className="icon-btn sm" 
              title="Export as JSON"
              onClick={() => onExport('json')}
              disabled={history.length === 0}
            >
              <FileJson size={16} />
            </button>
            <button 
              className="icon-btn sm" 
              title="Export as CSV"
              onClick={() => onExport('csv')}
              disabled={history.length === 0}
            >
              <FileSpreadsheet size={16} />
            </button>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="panel-content" id="history-list">
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '2rem' }}>
            No history yet
          </div>
        ) : (
          history.map((item, index) => (
            <div 
              key={index} 
              className="history-item" 
              onClick={() => onSelect(item)}
            >
              <div className="history-meta">
                <span className="flex items-center gap-1">
                  {getLangName(item.sourceLang)} <ArrowRight size={12} /> {getLangName(item.targetLang)}
                </span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="history-source">{item.source}</div>
              <div className="history-target">{item.target}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <button 
          className="lang-select-btn justify-center" 
          onClick={onClear}
          style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={16} style={{ marginRight: '0.5rem' }} /> Clear History
        </button>
      </div>
    </aside>
  );
};

export default HistoryPanel;

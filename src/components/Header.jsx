import React from 'react';
import { Languages, Moon, Sun, History, Settings } from 'lucide-react';

const Header = ({ toggleTheme, toggleHistory, toggleSettings, theme }) => {
  return (
    <header className="header">
      <div className="container flex justify-between w-full h-full items-center">
        <a href="#" className="header__logo">
          <Languages className="text-accent-primary" size={32} color="var(--accent-primary)" />
          <div className="header__title text-gradient">AI Translator<span> Pro</span></div>
        </a>
        <div className="flex items-center gap-2">
          <button 
            className="icon-btn" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme" 
            title="Toggle Theme (Ctrl+J)"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="icon-btn" 
            onClick={toggleHistory} 
            aria-label="View History" 
            title="History (Ctrl+H)"
          >
            <History size={20} />
          </button>
          <button 
            className="icon-btn" 
            onClick={toggleSettings}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User Avatar" 
            style={{
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              border: '2px solid var(--bg-secondary)', 
              marginLeft: '0.5rem', 
              cursor: 'pointer'
            }} 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

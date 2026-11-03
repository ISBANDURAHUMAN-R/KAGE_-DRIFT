import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorText: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorText: error?.message || 'Unexpected GPU/Script interruption' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('KAGE DRIFT runtime exception caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#050611] text-white p-6 select-none font-sans">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-rose-500/40 text-center shadow-2xl backdrop-blur-md space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Orbitron'] text-rose-400 tracking-wider">
              KAGE ENGINE // FAULT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              The graphics driver or session encountered an interruption. Your save data is safe in local storage.
            </p>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono break-words text-left">
              {this.state.errorText}
            </div>
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-rose-500 text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-90 transition active:scale-95 cursor-pointer"
            >
              RESTART ENGINE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

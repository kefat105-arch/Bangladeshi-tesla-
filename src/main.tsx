import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Endless Ride Bangladesh:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950 text-white text-center select-none">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 text-2xl font-black">
              ⚠️
            </div>
            <h1 className="text-2xl font-black text-white">RIDE INTERRUPTED</h1>
            <p className="text-xs text-rose-400 font-semibold mt-1">
              {this.state.error?.message || 'An unexpected graphics error occurred.'}
            </p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              We encountered an issue initializing the 3D environment. Tap reload to restart your journey on the highway.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              RELOAD RIDE / পুনরায় শুরু
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('NEEP-NLP ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  handleGoHome = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-white text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-5 text-balance">
              An unexpected error occurred while rendering the tournament tracker.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-5 text-left overflow-x-auto">
                <p className="text-red-400 font-mono text-xs font-semibold">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RotateCcw size={16} /> Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Home size={14} /> Go to Default Room
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 rounded-xl font-medium text-xs text-slate-500 hover:text-red-400 transition"
              >
                Clear Local Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

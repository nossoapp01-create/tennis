import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('KicksLuxe Vault App Error Caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131314] text-white flex flex-col items-center justify-center p-6 text-center font-jakarta">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white mb-2">
            KICKSLUXE VAULT // RECUPERAÇÃO SEGURA
          </h1>

          <p className="text-sm text-zinc-400 max-w-md mb-6">
            Ocorreu uma oscilação na renderização de dados. Seu estoque e configurações estão protegidos no banco local.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restaurar Painel & Recarregar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

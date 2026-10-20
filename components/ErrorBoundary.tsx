'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { safeLogError } from '@/lib/securityVault';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan pada komponen tampilan.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    safeLogError('ErrorBoundary caught rendering error', {
      error: error?.message,
      componentStack: errorInfo?.componentStack?.slice(0, 300),
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full my-4 p-6 rounded-3xl card-frosted-obsidian border border-rose-500/20 bg-black/60 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-cinematic font-bold text-white">
              {this.props.fallbackTitle || 'Konten Sementara Tidak Dapat Ditampilkan'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {this.props.fallbackMessage ||
                'Terjadi kendala saat memuat bagian ini. Silakan coba muat ulang atau pilih konten lain.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white spring-press transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

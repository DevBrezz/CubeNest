import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CubeNest rendering error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#080d12', color: '#f2f8fb', fontFamily: 'system-ui, sans-serif' }}>
        <section style={{ width: 'min(100%, 560px)', padding: 28, border: '1px solid #29404b', borderRadius: 16, background: '#101820' }}>
          <p style={{ color: '#5de6ef', fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>CUBENEST · RECOVERY</p>
          <h1 style={{ fontSize: 28, margin: '12px 0' }}>This page hit an error.</h1>
          <p style={{ color: '#a9bbc4', lineHeight: 1.7 }}>The site could not render this view. Reload the page, or return to the homepage. The error has also been written to the browser console for debugging.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#e7c8c8', fontSize: 12 }}>{this.state.message}</pre>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '11px 15px', border: 0, borderRadius: 8, background: '#5de6ef', color: '#061419', fontWeight: 700 }}>Reload page</button>
            <button onClick={() => { window.location.href = '/'; }} style={{ padding: '11px 15px', border: '1px solid #344b57', borderRadius: 8, background: 'transparent', color: '#eaf4fa' }}>Go to homepage</button>
          </div>
        </section>
      </main>;
    }
    return this.props.children;
  }
}

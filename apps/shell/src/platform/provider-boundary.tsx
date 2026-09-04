import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react';

type ProviderBoundaryProps = {
  children: ReactNode;
  name: string;
  version?: string;
  url?: string;
  loadingFallback?: ReactNode;
};

type ProviderBoundaryState = {
  error: Error | null;
  requestId: string | null;
};

export class ProviderBoundary extends Component<
  ProviderBoundaryProps,
  ProviderBoundaryState
> {
  state: ProviderBoundaryState = { error: null, requestId: null };

  static getDerivedStateFromError(error: Error): ProviderBoundaryState {
    return { error, requestId: crypto.randomUUID() };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Provider failed to render', {
      error,
      componentStack: info.componentStack,
      provider: this.props.name,
      requestId: this.state.requestId,
      url: this.props.url,
      version: this.props.version,
    });
  }

  private retry = (): void => {
    this.setState({ error: null, requestId: null });
  };

  render() {
    if (this.state.error) {
      return (
        <section role="alert">
          <h2>{this.props.name} is temporarily unavailable</h2>
          <p>Please try again. Support ID: {this.state.requestId}</p>
          <button type="button" onClick={this.retry}>
            Try again
          </button>
        </section>
      );
    }

    return (
      <Suspense
        fallback={
          this.props.loadingFallback ?? <p>Loading {this.props.name}...</p>
        }
      >
        {this.props.children}
      </Suspense>
    );
  }
}

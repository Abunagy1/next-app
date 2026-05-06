'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('HeaderNav error:', error); }
  render() {
    if (this.state.hasError) return null;  // gracefully hide navigation
    return this.props.children;
  }
}
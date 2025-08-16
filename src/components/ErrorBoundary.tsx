"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showDetails?: boolean;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private resetTimeoutId: number | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log error to external service if needed
        // logErrorToService(error, errorInfo);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps) {
        const { resetOnPropsChange, resetKeys } = this.props;
        const { hasError } = this.state;

        // Reset error boundary when resetKeys change
        if (hasError && resetOnPropsChange && resetKeys) {
            const prevResetKeys = prevProps.resetKeys || [];
            const hasResetKeyChanged = resetKeys.some(
                (resetKey, idx) => prevResetKeys[idx] !== resetKey
            );

            if (hasResetKeyChanged) {
                this.resetErrorBoundary();
            }
        }
    }

    resetErrorBoundary = () => {
        if (this.resetTimeoutId) {
            window.clearTimeout(this.resetTimeoutId);
        }

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleRetry = () => {
        this.resetErrorBoundary();
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    render() {
        const { hasError, error } = this.state;
        const { children, fallback, showDetails = false } = this.props;

        if (hasError) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
                    <Card className="w-full max-w-md mx-auto shadow-lg border-red-200">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <CardTitle className="text-xl text-red-800">
                                Une erreur s&apos;est produite
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600 text-center">
                                Nous nous excusons pour ce problème. L&apos;application a rencontré une erreur inattendue.
                            </p>

                            {showDetails && error && (
                                <details className="bg-gray-50 p-3 rounded-lg border">
                                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                                        Détails techniques
                                    </summary>
                                    <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border overflow-auto max-h-32">
                                        <div className="mb-2">
                                            <strong>Erreur:</strong> {error.message}
                                        </div>
                                        {error.stack && (
                                            <div>
                                                <strong>Stack trace:</strong>
                                                <pre className="whitespace-pre-wrap text-xs mt-1">
                                                    {error.stack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={this.handleRetry}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Réessayer
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={this.handleReload}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Recharger
                                    </Button>

                                    <Button
                                        onClick={this.handleGoHome}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Home className="w-4 h-4 mr-2" />
                                        Accueil
                                    </Button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 text-center">
                                Si le problème persiste, veuillez contacter le support technique.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return children;
    }
}

// Hook version for functional components
export function useErrorHandler() {
    return (error: Error, errorInfo?: ErrorInfo) => {
        console.error("Error caught by useErrorHandler:", error, errorInfo);

        // You can add custom error reporting logic here
        // reportError(error, errorInfo);
    };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
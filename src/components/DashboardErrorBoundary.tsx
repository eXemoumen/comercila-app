"use client";

import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface DashboardErrorBoundaryProps {
    children: React.ReactNode;
    section?: string;
    onRetry?: () => void;
}

// Custom fallback for dashboard sections
function DashboardErrorFallback({
    section = "section",
    onRetry
}: {
    section?: string;
    onRetry?: () => void;
}) {
    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        window.location.href = "/";
    };

    return (
        <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-red-800 text-base">
                        Erreur dans {section}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-red-700">
                    Cette section n&apos;a pas pu se charger correctement.
                </p>

                <div className="flex gap-2">
                    <Button
                        onClick={handleRetry}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Réessayer
                    </Button>

                    <Button
                        onClick={handleGoHome}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                        <Home className="h-4 w-4 mr-1" />
                        Accueil
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Metrics section error fallback
function MetricsErrorFallback({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-700">Erreur de chargement</p>
                        {i === 0 && onRetry && (
                            <Button
                                onClick={onRetry}
                                size="sm"
                                variant="outline"
                                className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Réessayer
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Chart section error fallback
function ChartErrorFallback({ title, onRetry }: { title?: string; onRetry?: () => void }) {
    return (
        <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-800">
                    {title || "Graphique"}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-red-700 mb-3">
                    Impossible de charger le graphique
                </p>
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Réessayer
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Main dashboard error boundary
export function DashboardErrorBoundary({
    children,
    section = "tableau de bord",
    onRetry
}: DashboardErrorBoundaryProps) {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        console.error(`Error in dashboard ${section}:`, error, errorInfo);

        // Log to external service if needed
        // logErrorToService(error, { section, ...errorInfo });
    };

    return (
        <ErrorBoundary
            onError={handleError}
            fallback={<DashboardErrorFallback section={section} onRetry={onRetry} />}
            resetOnPropsChange={true}
            resetKeys={[section]}
        >
            {children}
        </ErrorBoundary>
    );
}

// Metrics section error boundary
export function MetricsErrorBoundary({
    children,
    onRetry
}: {
    children: React.ReactNode;
    onRetry?: () => void;
}) {
    return (
        <ErrorBoundary
            fallback={<MetricsErrorFallback onRetry={onRetry} />}
            onError={(error, errorInfo) => {
                console.error("Error in metrics section:", error, errorInfo);
            }}
        >
            {children}
        </ErrorBoundary>
    );
}

// Chart section error boundary
export function ChartErrorBoundary({
    children,
    title,
    onRetry
}: {
    children: React.ReactNode;
    title?: string;
    onRetry?: () => void;
}) {
    return (
        <ErrorBoundary
            fallback={<ChartErrorFallback title={title} onRetry={onRetry} />}
            onError={(error, errorInfo) => {
                console.error(`Error in chart ${title}:`, error, errorInfo);
            }}
        >
            {children}
        </ErrorBoundary>
    );
}

// Page section error boundary
export function PageErrorBoundary({
    children,
    pageName,
    onRetry
}: {
    children: React.ReactNode;
    pageName: string;
    onRetry?: () => void;
}) {
    const handleGoBack = () => {
        window.history.back();
    };

    const fallback = (
        <div className="space-y-4 pb-20">
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <CardTitle className="text-red-800">
                            Erreur dans {pageName}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-red-700">
                        Cette page n&apos;a pas pu se charger correctement. Veuillez réessayer ou revenir en arrière.
                    </p>

                    <div className="flex gap-2">
                        <Button
                            onClick={onRetry || (() => window.location.reload())}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Réessayer
                        </Button>

                        <Button
                            onClick={handleGoBack}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                            Retour
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <ErrorBoundary
            fallback={fallback}
            onError={(error, errorInfo) => {
                console.error(`Error in page ${pageName}:`, error, errorInfo);
            }}
        >
            {children}
        </ErrorBoundary>
    );
}
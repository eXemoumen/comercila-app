import React, { Suspense } from "react";
import { PageLoadingFallback } from "./PageLoadingFallback";
import { ErrorBoundary } from "./ErrorBoundary";

interface LazyComponentWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    pageName?: string;
}

/**
 * Higher-order component for wrapping lazy-loaded components
 * with proper error boundaries and loading states
 */
export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
    children,
    fallback,
    errorFallback,
    pageName = "composant"
}) => {
    const defaultFallback = fallback || <PageLoadingFallback pageName={pageName} />;

    const defaultErrorFallback = errorFallback || (
        <div className="flex items-center justify-center min-h-[400px] py-8">
            <div className="text-center">
                <div className="text-red-600 mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-red-800 mb-1">
                    Erreur de chargement
                </h3>
                <p className="text-red-600 text-sm mb-4">
                    Impossible de charger {pageName}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                    Recharger la page
                </button>
            </div>
        </div>
    );

    return (
        <ErrorBoundary fallback={defaultErrorFallback}>
            <Suspense fallback={defaultFallback}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
};

/**
 * HOC factory for creating lazy-loaded components with consistent error handling
 */
export const withLazyLoading = <P extends object>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>,
    pageName: string,
    fallback?: React.ReactNode
) => {
    const LazyComponent = React.lazy(importFn);

    return React.forwardRef<unknown, P>((props, ref) => (
        <LazyComponentWrapper
            pageName={pageName}
            fallback={fallback}
        >
            <LazyComponent {...props} ref={ref} />
        </LazyComponentWrapper>
    ));
};

export default LazyComponentWrapper;
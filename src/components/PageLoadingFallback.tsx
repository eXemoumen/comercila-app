import React from "react";
import { LoadingSpinner } from "./LoadingSkeleton";

interface PageLoadingFallbackProps {
    pageName?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({
    pageName = "page"
}) => {
    return (
        <div className="flex items-center justify-center min-h-[400px] py-8">
            <div className="text-center">
                <LoadingSpinner />
                <p className="text-sm text-gray-500 mt-2">
                    Chargement de {pageName}...
                </p>
            </div>
        </div>
    );
};

export default PageLoadingFallback;
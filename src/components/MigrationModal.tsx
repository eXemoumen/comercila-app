"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, Database, HardDrive } from "lucide-react";
import {
    runFullMigration,
    isMigrationNeeded,
    getMigrationStatus,
    type MigrationResult
} from "@/utils/migration";
import { refreshStorageConfig } from "@/utils/hybridStorage";

interface MigrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

interface MigrationStep {
    key: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: MigrationResult;
}

export function MigrationModal({ isOpen, onClose, onComplete }: MigrationModalProps) {
    const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
        {
            key: 'supermarkets',
            name: 'Supermarchés',
            description: 'Migration des données des supermarchés',
            status: 'pending'
        },
        {
            key: 'sales',
            name: 'Ventes',
            description: 'Migration des données de ventes et paiements',
            status: 'pending'
        },
        {
            key: 'orders',
            name: 'Commandes',
            description: 'Migration des commandes en cours et historique',
            status: 'pending'
        },
        {
            key: 'stock',
            name: 'Stock',
            description: 'Migration de l\'historique des stocks',
            status: 'pending'
        },
        {
            key: 'fragranceStock',
            name: 'Stock Parfums',
            description: 'Migration des stocks par parfum',
            status: 'pending'
        }
    ]);

    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalMigrated, setTotalMigrated] = useState(0);
    const [totalErrors, setTotalErrors] = useState(0);
    const [showDetails, setShowDetails] = useState(false);

    const checkMigrationStatus = useCallback(() => {
        const status = getMigrationStatus();
        if (status) {
            setMigrationSteps(prev => prev.map(step => ({
                ...step,
                status: status[step.key as keyof typeof status] ? 'completed' : 'pending'
            })));

            const completedSteps = Object.values(status).filter(Boolean).length;
            setProgress((completedSteps / migrationSteps.length) * 100);
        }
    }, [migrationSteps.length]);

    useEffect(() => {
        if (isOpen) {
            checkMigrationStatus();
        }
    }, [isOpen, checkMigrationStatus]);

    const runMigration = async () => {
        setIsRunning(true);
        setProgress(0);
        setTotalMigrated(0);
        setTotalErrors(0);

        try {
            const result = await runFullMigration();

            // Update steps with results
            setMigrationSteps(prev => prev.map(step => {
                const stepResult = result.results[step.key];
                return {
                    ...step,
                    status: stepResult ? (stepResult.success ? 'completed' : 'error') : 'pending',
                    result: stepResult
                };
            }));

            setTotalMigrated(result.totalMigrated);
            setTotalErrors(result.totalErrors);
            setProgress(100);

            // Refresh storage configuration
            refreshStorageConfig();

            // Show success message
            if (result.success) {
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }

        } catch (error) {
            console.error("Migration failed:", error);
            setMigrationSteps(prev => prev.map(step => ({
                ...step,
                status: step.status === 'running' ? 'error' : step.status
            })));
        } finally {
            setIsRunning(false);
        }
    };

    const getStepIcon = (status: MigrationStep['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'running':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
        }
    };

    if (!isOpen) return null;

    const needsMigration = isMigrationNeeded();
    const completedSteps = migrationSteps.filter(step => step.status === 'completed').length;
    const isComplete = completedSteps === migrationSteps.length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <HardDrive className="h-8 w-8 text-gray-600" />
                        <div className="text-2xl">→</div>
                        <Database className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">
                        Migration vers Supabase
                    </CardTitle>
                    <p className="text-gray-600">
                        {needsMigration
                            ? "Migration de vos données locales vers la base de données cloud"
                            : "Migration déjà effectuée"
                        }
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {needsMigration && !isComplete && (
                        <>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Progression</span>
                                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>

                            <div className="space-y-3">
                                {migrationSteps.map((step) => (
                                    <div key={step.key} className="flex items-center gap-3 p-3 rounded-lg border">
                                        {getStepIcon(step.status)}
                                        <div className="flex-1">
                                            <div className="font-medium">{step.name}</div>
                                            <div className="text-sm text-gray-600">{step.description}</div>
                                            {step.result && showDetails && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {step.result.message}
                                                </div>
                                            )}
                                        </div>
                                        {step.result && (
                                            <div className="text-right text-sm">
                                                <div className="text-green-600">+{step.result.migrated}</div>
                                                {step.result.errors > 0 && (
                                                    <div className="text-red-600">⚠{step.result.errors}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {(totalMigrated > 0 || totalErrors > 0) && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Résumé</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowDetails(!showDetails)}
                                        >
                                            {showDetails ? 'Masquer' : 'Détails'}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{totalMigrated}</div>
                                            <div className="text-sm text-gray-600">Éléments migrés</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
                                            <div className="text-sm text-gray-600">Erreurs</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {isComplete && (
                        <div className="text-center py-8">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-green-700 mb-2">
                                Migration terminée !
                            </h3>
                            <p className="text-gray-600">
                                Toutes vos données ont été migrées avec succès vers Supabase.
                                L&apos;application va maintenant utiliser la base de données cloud.
                            </p>
                        </div>
                    )}

                    {!needsMigration && !isComplete && (
                        <div className="text-center py-8">
                            <Database className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">
                                Migration déjà effectuée
                            </h3>
                            <p className="text-gray-600">
                                Vos données sont déjà synchronisées avec Supabase.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        {!isComplete && (
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isRunning}
                            >
                                Annuler
                            </Button>
                        )}

                        {needsMigration && !isComplete && (
                            <Button
                                onClick={runMigration}
                                disabled={isRunning}
                                className="min-w-[120px]"
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Migration...
                                    </>
                                ) : (
                                    'Démarrer la migration'
                                )}
                            </Button>
                        )}

                        {(isComplete || !needsMigration) && (
                            <Button onClick={onComplete}>
                                Continuer
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
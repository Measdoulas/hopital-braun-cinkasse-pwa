import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DEFAULT_SERVICE_CONFIG } from '../../utils/data-models';
import { Save, Plus, Trash2, Settings, ToggleLeft, ToggleRight, Pencil, X, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const STANDARD_FIELDS = [
    { key: 'movements.effectifDebut', defaultLabel: 'Effectif Début' },
    { key: 'movements.entrees', defaultLabel: 'Entrées' },
    { key: 'movements.totalSorties', defaultLabel: 'Total Sorties' }, // Calculated, usually read-only label
    { key: 'movements.effectifFin', defaultLabel: 'Effectif Fin' },
    { key: 'sorties.domicile', defaultLabel: 'Sorties (Guérison/Domicile)' },
    { key: 'sorties.deces', defaultLabel: 'Décès' },
    { key: 'sorties.referes', defaultLabel: 'Référés (Vers ext.)' },
    { key: 'sorties.transferts', defaultLabel: 'Transférés (Interne)' },
    { key: 'sorties.fugitifs', defaultLabel: 'Évadés / Fugitifs' },
    { key: 'sorties.observ', defaultLabel: 'Mise en OBS' },
    { key: 'sorties.contreAvis', defaultLabel: 'Sorties c/ Avis Médical' },
    { key: 'sorties.autres', defaultLabel: 'Autres Sorties' },
    { key: 'consultations.total', defaultLabel: 'Consultations (Total)' },
    { key: 'observations.pannes', defaultLabel: 'Pannes / Matériel' },
    { key: 'observations.general', defaultLabel: 'Observations Générales' },
];

const ServiceConfigSection = ({ serviceId, serviceName }) => {
    const [config, setConfig] = useState(DEFAULT_SERVICE_CONFIG);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isStandardFieldsOpen, setIsStandardFieldsOpen] = useState(false);

    // Charger la config au montage
    useEffect(() => {
        const savedConfig = localStorage.getItem(`service_config_${serviceId}`);
        if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
        } else {
            setConfig(DEFAULT_SERVICE_CONFIG);
        }
    }, [serviceId]);

    const handleSave = () => {
        setLoading(true);
        // Simulation d'appel API, ici on sauve en localStorage
        setTimeout(() => {
            localStorage.setItem(`service_config_${serviceId}`, JSON.stringify(config));
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 800);
    };

    const toggleFeature = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Gestion des champs personnalisés
    const addCustomOption = () => {
        const newOption = {
            id: `opt_${Date.now()}`,
            label: 'Nouvelle option',
            type: 'number' // 'number' | 'text' | 'boolean'
        };
        setConfig(prev => ({
            ...prev,
            customOptions: [...(prev.customOptions || []), newOption]
        }));
    };

    const removeCustomOption = (id) => {
        setConfig(prev => ({
            ...prev,
            customOptions: prev.customOptions.filter(o => o.id !== id)
        }));
    };

    const updateCustomOption = (id, field, value) => {
        setConfig(prev => ({
            ...prev,
            customOptions: prev.customOptions.map(o =>
                o.id === id ? { ...o, [field]: value } : o
            )
        }));
    };

    return (
        <Card className="border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50/50">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Settings className="w-5 h-5" />
                    Configuration du Service : {serviceName}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">

                {/* 1. Sections Activées */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-neutral-900 border-b pb-2">Modules du Rapport</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FeatureToggle
                            label="Mouvements (Entrées/Sorties)"
                            checked={config.enableMovements}
                            onChange={() => toggleFeature('enableMovements')}
                        />
                        <FeatureToggle
                            label="Actes Médicaux"
                            checked={config.enableActs}
                            onChange={() => toggleFeature('enableActs')}
                        />
                        <FeatureToggle
                            label="Consultations Externes"
                            checked={config.enableConsultations}
                            onChange={() => toggleFeature('enableConsultations')}
                        />
                        <FeatureToggle
                            label="Observations Générales"
                            checked={config.enableObservations}
                            onChange={() => toggleFeature('enableObservations')}
                        />
                    </div>
                </div>

                {/* 2. Champs Standards */}
                <div className="space-y-4">
                    <div
                        className="flex items-center justify-between border-b pb-2 cursor-pointer hover:bg-gray-50 rounded px-1 transition-colors"
                        onClick={() => setIsStandardFieldsOpen(!isStandardFieldsOpen)}
                    >
                        <h3 className="font-semibold text-neutral-900">Personnalisation des Champs Standards</h3>
                        {isStandardFieldsOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>

                    {isStandardFieldsOpen && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {STANDARD_FIELDS.map((field) => {
                                const isHidden = config.hiddenFields?.includes(field.key);
                                const currentLabel = config.labelOverrides?.[field.key] || field.defaultLabel;

                                const toggleVisibility = (e) => {
                                    e.stopPropagation();
                                    setConfig(prev => {
                                        const hidden = prev.hiddenFields || [];
                                        if (hidden.includes(field.key)) {
                                            return { ...prev, hiddenFields: hidden.filter(k => k !== field.key) };
                                        } else {
                                            return { ...prev, hiddenFields: [...hidden, field.key] };
                                        }
                                    });
                                };

                                const updateLabel = (newLabel) => {
                                    setConfig(prev => ({
                                        ...prev,
                                        labelOverrides: {
                                            ...(prev.labelOverrides || {}),
                                            [field.key]: newLabel
                                        }
                                    }));
                                };

                                return (
                                    <div key={field.key} className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className={`p-2 rounded-lg cursor-pointer transition-colors ${!isHidden ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                                                onClick={toggleVisibility}
                                                title={isHidden ? "Champ masqué" : "Champ visible"}
                                            >
                                                {isHidden ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-neutral-500 block">Libellé Par Défaut : {field.defaultLabel}</label>
                                                <Input
                                                    value={currentLabel}
                                                    onChange={(e) => updateLabel(e.target.value)}
                                                    className={`h-8 text-sm ${isHidden ? 'text-gray-400 bg-gray-50' : 'text-neutral-900'}`}
                                                    disabled={isHidden}
                                                    placeholder={field.defaultLabel}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-8 ml-2 flex justify-end">
                                            {!isHidden && config.labelOverrides?.[field.key] && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => updateLabel("")}
                                                    className="text-orange-500 hover:bg-orange-50 h-8 w-8 p-0"
                                                    title="Réinitialiser"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Champs Personnalisés */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-neutral-900">Champs Personnalisés</h3>
                        <Button size="sm" variant="outline" onClick={addCustomOption}>
                            <Plus className="w-4 h-4 mr-1" /> Ajouter
                        </Button>
                    </div>

                    {(!config.customOptions || config.customOptions.length === 0) && (
                        <p className="text-sm text-neutral-500 italic text-center py-4">
                            Aucun champ personnalisé configuré.
                        </p>
                    )}

                    <div className="space-y-3">
                        {config.customOptions?.map((option) => (
                            <CustomOptionRow
                                key={option.id}
                                option={option}
                                onUpdate={updateCustomOption}
                                onDelete={removeCustomOption}
                            />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Enregistrement...' : (saved ? 'Sauvegardé !' : 'Enregistrer la configuration')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const FeatureToggle = ({ label, checked, onChange }) => (
    <div
        onClick={onChange}
        className={`
            flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
            ${checked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
        `}
    >
        <span className={`text-sm font-medium ${checked ? 'text-blue-900' : 'text-gray-500'}`}>{label}</span>
        {checked ? (
            <ToggleRight className="w-6 h-6 text-blue-600" />
        ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
        )}
    </div>
);

const CustomOptionRow = ({ option, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempLabel, setTempLabel] = useState(option.label);
    const [tempType, setTempType] = useState(option.type);

    const handleEdit = () => {
        setIsEditing(true);
        setTempLabel(option.label);
        setTempType(option.type);
    };

    const handleSave = () => {
        onUpdate(option.id, 'label', tempLabel);
        onUpdate(option.id, 'type', tempType);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempLabel(option.label);
        setTempType(option.type);
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'number': return 'Nombre';
            case 'text': return 'Texte';
            case 'boolean': return 'Oui/Non';
            default: return type;
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="flex-1 w-full">
                    <label className="text-xs text-blue-700 mb-1 block font-medium">Libellé</label>
                    <Input
                        value={tempLabel}
                        onChange={(e) => setTempLabel(e.target.value)}
                        className="h-9 bg-white"
                        autoFocus
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs text-blue-700 mb-1 block font-medium">Type</label>
                    <select
                        value={tempType}
                        onChange={(e) => setTempType(e.target.value)}
                        className="w-full h-9 rounded-md border border-gray-300 text-sm p-1"
                    >
                        <option value="number">Nombre</option>
                        <option value="text">Texte</option>
                        <option value="boolean">Oui/Non</option>
                    </select>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className="text-green-600 hover:bg-green-100"
                        title="Valider"
                    >
                        <Save className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-gray-500 hover:bg-gray-100"
                        title="Annuler"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3 rounded-md border hover:border-gray-300 transition-colors">
            <div className="flex-1">
                <span className="font-medium text-gray-900">{option.label}</span>
                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {getTypeLabel(option.type)}
                </span>
            </div>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-blue-600 hover:bg-blue-50"
                    title="Modifier"
                >
                    <Pencil className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(option.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Supprimer"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default ServiceConfigSection;

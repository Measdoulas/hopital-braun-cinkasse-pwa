import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { ChevronRight } from 'lucide-react';
import { SERVICES } from '../../../utils/data-models';

const ServiceList = ({ data }) => {
    // Transformer l'objet SERVICES en tableau pour l'affichage
    const servicesList = Object.values(SERVICES).map(service => ({
        id: service.id,
        name: service.name,
        head: "Dr. Responsable", // Placeholder, à dynamiser plus tard
        activity: Math.floor(Math.random() * 100) + 20, // Mock data
        trend: Math.random() > 0.5 ? 'up' : 'down'
    }));

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-4 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-neutral-800">Résumé par Service</CardTitle>
                    <button className="text-sm text-primary font-medium hover:underline">Voir tout</button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-neutral-100">
                    {servicesList.map((service) => (
                        <div key={service.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer group">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-sm">
                                    {service.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-800">{service.name}</p>
                                    <p className="text-xs text-neutral-500">{service.head}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="font-bold text-neutral-800">{service.activity}</p>
                                    <p className="text-xs text-neutral-400">Patients</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ServiceList;

import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({ title, value, subValue, trend, trendValue, icon: Icon, color = "blue" }) => {
    const colorStyles = {
        blue: { bg: "bg-blue-50", text: "text-blue-600" },
        purple: { bg: "bg-purple-50", text: "text-purple-600" },
        orange: { bg: "bg-orange-50", text: "text-orange-600" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
        red: { bg: "bg-red-50", text: "text-red-600" },
    };

    const style = colorStyles[color] || colorStyles.blue;

    const renderTrend = () => {
        if (!trend) return null;
        if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
        if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
        return <Minus className="w-4 h-4 text-neutral-400" />;
    };

    const trendColor = trend === 'up' ? 'text-emerald-600 bg-emerald-50' : trend === 'down' ? 'text-rose-600 bg-rose-50' : 'text-neutral-500 bg-neutral-100';

    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-none">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-neutral-500">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-neutral-900 mt-2 tracking-tight">{value}</h3>
                            {subValue && <span className="text-sm font-medium text-neutral-400">{subValue}</span>}
                        </div>
                    </div>
                    <div className={clsx("p-3 rounded-xl", style.bg)}>
                        <Icon className={clsx("w-6 h-6", style.text)} />
                    </div>
                </div>
                {trendValue && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className={clsx("inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium", trendColor)}>
                            {renderTrend()}
                            <span className="ml-1">{trendValue}</span>
                        </span>
                        <span className="text-xs text-neutral-400">vs mois dernier</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;

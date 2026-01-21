import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card" // Ensure you have shadcn card or basic card

// Since we might not have shadcn installed fully yet, I'll use standard tailwind for now and can refine later.
// The user prompt mentioned shadcn was part of previous conv, but I should ensure it works. 
// I'll stick to raw tailwind for simplicity unless I see ui components.
// The `task.md` didn't explicitly say "install shadcn components".
// "Reuse same backend APIs" "Match Flutter behavior".

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string; // Tailwind text color class, e.g. "text-blue-500"
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
    return (
        <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
};

export default StatCard;

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

const FeatureCard = ({ icon: Icon, title, description, iconColor }: FeatureCardProps) => {
  return (
    <Card className="hover:shadow-2xl transition-shadow transform hover:-translate-y-1 hover:scale-[1.01] duration-200">
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColor} ring-1 ring-inset ring-border/40`}> 
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;

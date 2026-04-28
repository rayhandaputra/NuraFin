import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subValue?: string;
  color?: "primary" | "secondary" | "tertiary" | "danger";
}

export const StatCard = ({ title, value, icon: Icon, subValue, color = "primary" }: StatCardProps) => {
  const borderColorMap = {
    primary: "border-[#8DA382]",
    secondary: "border-[#7DA5B3]",
    tertiary: "border-[#D4A373]",
    danger: "border-red-500",
  };

  const titleColorMap = {
    primary: "text-[#8DA382]",
    secondary: "text-[#7DA5B3]",
    tertiary: "text-[#D4A373]",
    danger: "text-red-500",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 ${borderColorMap[color]} transition-all`}
    >
      <div className="flex flex-col">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${titleColorMap[color]}`}>
          {title}
        </p>
        <h3 className="text-2xl font-bold mt-1 text-[#4A4A4A]">
          {value}
        </h3>
        {subValue && (
          <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
            {subValue}
          </p>
        )}
        {title === "Health Score" && typeof value === 'string' && (
          <div className="w-full h-1 bg-[#F5F2E9] mt-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-tertiary" 
              style={{ width: `${value.split('/')[0]}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

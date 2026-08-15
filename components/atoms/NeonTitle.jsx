import { cn } from "@/lib/utils";

export function NeonTitle({ children, color = "primary", className, as = "h1", icon: Icon, textSize = "text-3xl md:text-4xl" }) {
    const Component = as;

    const colorClasses = {
        primary: "neon-text-primary",
        accent: "neon-text-accent",
        warning: "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]",
        blue: "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]",
    };

    const iconColors = {
        primary: "text-primary",
        accent: "text-accent",
        warning: "text-yellow-400",
        blue: "text-blue-400",
    };

    return (
        <Component className={cn(`${textSize} flex items-center gap-2 font-bold tracking-widest text-white uppercase`, colorClasses[color], className)}>
            {Icon && <Icon className={cn("h-7 w-7 md:h-8 md:w-8", iconColors[color])} />}
            {children}
        </Component>
    );
}

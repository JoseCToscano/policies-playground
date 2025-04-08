import { cn } from "~/lib/utils"

export function LoadingDots({ className, color = "white" }: { className?: string, color?: string }) {
    return (
        <span className={cn("inline-flex items-center")}>
            {[...Array(3)].map((_, i) => (
                <span
                    key={i}
                    style={{
                        animationDelay: `${0.2 * i}s`,
                        backgroundColor: color,
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        display: "inline-block",
                        margin: "0 1px",
                    }}
                    className={cn("animate-blink", className)}
                />
            ))}
        </span>
    );
}

import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "outline" | "ghost" | "destructive";
	size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ variant = "primary", size = "md", className = "", children, ...props },
		ref,
	) => {
		const base =
			"inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
		const variants = {
			primary:
				"bg-[var(--accent)] text-white hover:opacity-85 focus-visible:ring-[var(--accent)]",
			outline:
				"border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--subtle-bg2)] focus-visible:ring-[var(--ink)]",
			ghost: "text-[var(--ink)] hover:bg-[var(--subtle-bg2)] focus-visible:ring-[var(--ink)]",
			destructive:
				"bg-[var(--live)] text-white hover:opacity-80 focus-visible:ring-[var(--live)]",
		};
		const sizes = {
			sm: "h-8 px-3 text-xs",
			md: "h-10 px-4 text-sm",
			lg: "h-12 px-6 text-base",
		};
		return (
			<button
				ref={ref}
				className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
				{...props}
			>
				{children}
			</button>
		);
	},
);
Button.displayName = "Button";

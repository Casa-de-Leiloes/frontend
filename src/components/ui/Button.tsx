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
				"bg-[#0D0D0D] text-white hover:bg-[#1a1a1a] focus-visible:ring-[#0D0D0D]",
			outline:
				"border border-[#E4E4E2] bg-white text-[#0D0D0D] hover:bg-[#F5F4F0] focus-visible:ring-[#0D0D0D]",
			ghost: "text-[#0D0D0D] hover:bg-[#F5F4F0] focus-visible:ring-[#0D0D0D]",
			destructive:
				"bg-[#DC2626] text-white hover:bg-[#b91c1c] focus-visible:ring-[#DC2626]",
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

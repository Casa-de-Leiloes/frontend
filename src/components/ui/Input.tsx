import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className = "", ...props }, ref) => (
		<input
			ref={ref}
			className={`w-full h-10 px-3 text-sm rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${className}`}
			style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
			{...props}
		/>
	),
);
Input.displayName = "Input";

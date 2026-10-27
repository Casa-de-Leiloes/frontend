import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className = "", ...props }, ref) => (
		<input
			ref={ref}
			className={`w-full h-10 px-3 text-sm bg-white border border-[#E4E4E2] rounded-md text-[#0D0D0D] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition-colors ${className}`}
			{...props}
		/>
	),
);
Input.displayName = "Input";

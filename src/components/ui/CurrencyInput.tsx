import { type InputHTMLAttributes } from "react";
import { Input } from "./Input";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
	/** Reais as decimal string, e.g. "4.00". Empty string = no value. */
	value: string;
	/** Emits reais decimal string, e.g. "42.05". */
	onChange: (value: string) => void;
};

/** "40005" → "400,05"  |  "400" → "4,00"  |  "" → "" */
function digitsToDisplay(digits: string): string {
	if (!digits) return "";
	const padded = digits.padStart(3, "0");
	const reaisPart = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	const centsPart = padded.slice(-2);
	return `${reaisPart || "0"},${centsPart}`;
}

/** "4.00" → "400"  |  "" / NaN → "" */
function reaisToDigits(reaisStr: string): string {
	if (!reaisStr) return "";
	const n = parseFloat(reaisStr);
	if (isNaN(n) || n < 0) return "";
	return Math.round(n * 100).toString();
}

export function CurrencyInput({
	value,
	onChange,
	placeholder,
	className = "",
	...props
}: CurrencyInputProps) {
	const digits = reaisToDigits(value);
	const displayed = digitsToDisplay(digits);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		// Keep only digit characters — ignore commas, dots, spaces
		const newDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
		if (!newDigits) {
			onChange("");
			return;
		}
		onChange((parseInt(newDigits, 10) / 100).toFixed(2));
	}

	return (
		<div className="relative">
			<span
				className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none"
				style={{ color: "var(--ink-subtle)" }}
			>
				R$
			</span>
			<Input
				{...props}
				type="text"
				inputMode="numeric"
				value={displayed}
				onChange={handleChange}
				placeholder={placeholder ?? "0,00"}
				className={`pl-9 ${className}`}
			/>
		</div>
	);
}

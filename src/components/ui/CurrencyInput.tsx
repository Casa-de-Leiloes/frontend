import { type InputHTMLAttributes } from "react";
import { Input } from "./Input";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
	value: string;
	onChange: (value: string) => void;
};

function applyMask(raw: string): string {
	// Strip everything except digits and comma
	const cleaned = raw.replace(/[^\d,]/g, "");
	const [intPart = "", decPart = ""] = cleaned.split(",");
	// Format integer part with dot thousands separator
	const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	if (cleaned.includes(",")) {
		return `${intFormatted},${decPart.slice(0, 2)}`;
	}
	return intFormatted;
}

function maskedToReaisStr(masked: string): string {
	// "10.000,50" → "10000.50"
	const withoutThousands = masked.replace(/\./g, "");
	const withDot = withoutThousands.replace(",", ".");
	const n = parseFloat(withDot);
	if (!withoutThousands || isNaN(n)) return "";
	return n.toFixed(2);
}

function reaisStrToMasked(reaisStr: string): string {
	if (!reaisStr) return "";
	const n = parseFloat(reaisStr);
	if (isNaN(n)) return "";
	return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrencyInput({ value, onChange, placeholder, className = "", ...props }: CurrencyInputProps) {
	const displayed = value ? reaisStrToMasked(value) : "";

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const masked = applyMask(e.target.value);
		const reaisStr = maskedToReaisStr(masked);
		onChange(reaisStr);
	}

	function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
		// On blur: ensure 2 decimal places shown
		if (value) {
			const n = parseFloat(value);
			if (!isNaN(n) && n > 0) {
				onChange(n.toFixed(2));
			}
		}
		props.onBlur?.(e);
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
				inputMode="decimal"
				value={displayed}
				onChange={handleChange}
				onBlur={handleBlur}
				placeholder={placeholder ?? "0,00"}
				className={`pl-9 ${className}`}
			/>
		</div>
	);
}

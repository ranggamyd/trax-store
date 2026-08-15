import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/**
 * Reusable form field with label, input, and error display.
 * Replaces the repeated <div><Label/><Input/>{error && <p/>}</div> pattern.
 *
 * Can be used in two modes:
 * 1. With `register` prop (react-hook-form integration)
 * 2. With `children` for custom content (e.g., combobox, switch)
 */
export function FormField({
    label,
    error,
    required,
    children,
    // Input mode props
    register,
    placeholder,
    id,
    type = "text",
    inputClassName = "bg-zinc-900 border-zinc-800",
}) {
    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor={id}>
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </Label>
            )}
            {children || <Input id={id} type={type} placeholder={placeholder} className={inputClassName} {...(register || {})} />}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

import React from "react";

interface FormFieldProps {
  label?: string;
  type?: "text" | "email" | "url" | "number" | "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  rows?: number;
}

export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = "",
  rows = 3,
}: FormFieldProps) {
  const baseClasses = `
    w-full px-3 py-2 border border-gray-300 rounded-md text-sm
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    disabled:bg-gray-50 disabled:text-gray-500 
    transition-colors duration-200
  `;

  const errorClasses = error
    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
    : "";

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`${baseClasses} ${errorClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses}`}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "maxLength" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Phone number input — digits only, max 10 digits.
 * Strips non-digit characters on paste/autofill and blocks typing past 10 digits.
 */
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip everything that isn't a digit, then cap at 10
      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
      onChange(digits);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End
      const controlKeys = [
        "Backspace", "Delete", "Tab", "Escape", "Enter",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End",
      ];
      if (controlKeys.includes(e.key)) return;

      // Allow Ctrl/Cmd + A/C/V/X/Z
      if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase())) return;

      // Block non-digits
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
      }

      // Block if already at 10 digits
      if (value.replace(/\D/g, "").length >= 10) {
        e.preventDefault();
      }
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(className)}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };

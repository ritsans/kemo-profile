import { forwardRef } from "react";

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={className ? `${INPUT_CLASS} ${className}` : INPUT_CLASS}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={className ? `${INPUT_CLASS} ${className}` : INPUT_CLASS}
    {...props}
  />
));
Textarea.displayName = "Textarea";

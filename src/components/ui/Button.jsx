// components/ui/button.js
export function Button({ children, className, ...props }) {
  return (
    <button
      className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all ${className}`}
      {...props}>
      {children}
    </button>
  );
}

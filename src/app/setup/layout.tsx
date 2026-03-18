// This layout intentionally does NOT use AuthProvider guard.
// Setup must be accessible before any users exist in the system.
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      {children}
    </div>
  );
}

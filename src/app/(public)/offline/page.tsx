import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">You are offline</h1>
        <p className="text-slate-600 text-sm mb-6">
          Please check your internet connection. Live inventory, checkout, and order updates require an active connection.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </Link>
      </div>
    </div>
  );
}

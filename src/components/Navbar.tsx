import { Link } from "react-router";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Gift className="w-6 h-6" />
          <span>RaffleFlow</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/app">
            <Button>Empezar Sorteo</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

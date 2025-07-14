import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/0a7a3dfa-7d14-452a-a686-8ca5581b9e1d.png" 
            alt="ENCORE Music Tech Solutions" 
            className="h-10 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/modules" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            Modules
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            Pricing
          </Link>
          <a href="#contact" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow">
            Start Free Trial
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
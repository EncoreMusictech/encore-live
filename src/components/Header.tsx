import { Button } from "@/components/ui/button";
import { Music, Menu, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="bg-gradient-primary rounded-lg p-2">
            <Music className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ENCORE
            </h1>
            <p className="text-xs text-muted-foreground">Music Tech Solutions</p>
          </div>
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
          {user ? (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow">
                  Start Free Trial
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
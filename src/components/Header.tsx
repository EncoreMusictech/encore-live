import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Music, Menu, User, LogOut, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { modules } from "@/data/modules";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-jet-black/90 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300">
          <div className="relative bg-gradient-vinyl rounded-lg p-2 border border-electric-lavender/30 shadow-glow">
            <div className="absolute inset-0 rounded-lg bg-gradient-primary opacity-20"></div>
            <div className="relative w-8 h-8 rounded-full bg-jet-black border border-electric-lavender flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-electric-lavender"></div>
            </div>
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ENCORE
            </h1>
            <p className="font-accent text-xs text-dusty-gold">RIGHTS MANAGEMENT SYSTEM</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="font-body text-sm font-medium text-platinum-gray/80 hover:text-electric-lavender transition-colors duration-300 bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-jet-black/95 backdrop-blur-lg border border-electric-lavender/20 shadow-glow">
                  <div className="grid w-[400px] gap-3 p-4">
                    {modules.map((module) => (
                      <NavigationMenuLink key={module.id} asChild>
                        <Link
                          to={`/features/${module.id}`}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-electric-lavender/10 hover:text-electric-lavender focus:bg-electric-lavender/10 focus:text-electric-lavender"
                        >
                          <div className="flex items-center gap-3">
                            <module.icon className="h-4 w-4 text-dusty-gold" />
                            <div>
                              <div className="text-sm font-medium leading-none text-platinum-gray">
                                {module.title}
                              </div>
                              <p className="line-clamp-2 text-xs leading-snug text-platinum-gray/60 mt-1">
                                {module.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <Link to="/modules" className="font-body text-sm font-medium text-platinum-gray/80 hover:text-electric-lavender transition-colors duration-300">
            Modules
          </Link>
          <Link to="/pricing" className="font-body text-sm font-medium text-platinum-gray/80 hover:text-dusty-gold transition-colors duration-300">
            Pricing
          </Link>
          <Link to="/contact" className="font-body text-sm font-medium text-platinum-gray/80 hover:text-electric-lavender transition-colors duration-300">
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <SubscriptionBadge />
          {user ? (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-dusty-gold" />
                <span className="font-body text-platinum-gray/80">{user.email}</span>
              </div>
              <Button variant="studio" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="fader" size="sm" className="font-body">
                Start Free Trial
              </Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col space-y-4 mt-6">
                <Link 
                  to="/modules" 
                  className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors py-2"
                >
                  Modules
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors py-2"
                >
                  Pricing
                </Link>
                <Link 
                  to="/contact" 
                  className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors py-2"
                >
                  Contact
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
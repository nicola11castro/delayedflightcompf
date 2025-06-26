import { useState } from "react";
import { Link } from "wouter";
import { Plane, Moon, Sun, Menu, X, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/components/theme-provider";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeContext();

  const navItems = [
    { href: "#claims", label: "Submit Claim" },
    { href: "#track", label: "Track Status" },
    { href: "#calculator", label: "Calculator" },
    { href: "#faq", label: "FAQ" },
  ];

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-background border-b-2 sticky top-0 z-50" style={{borderStyle: 'inset', borderColor: 'hsl(var(--border))'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Plane className="text-primary text-lg" />
            <span className="font-bold text-sm text-foreground">
              FlightClaim Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="win98-button text-xs"
              >
                {item.label}
              </button>
            ))}
            
            <Link href="/register">
              <Button variant="ghost" size="sm" className="win98-button text-xs">
                <UserPlus className="h-3 w-3 mr-1" />
                Register
              </Button>
            </Link>
            
            <a href="/api/login">
              <Button variant="ghost" size="sm" className="win98-button text-xs">
                <LogIn className="h-3 w-3 mr-1" />
                Login
              </Button>
            </a>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="win98-button text-xs"
            >
              {theme === "dark" ? (
                <Sun className="h-3 w-3" />
              ) : (
                <Moon className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="win98-button text-xs"
            >
              {theme === "dark" ? (
                <Sun className="h-3 w-3" />
              ) : (
                <Moon className="h-3 w-3" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="win98-button text-xs"
            >
              {isMobileMenuOpen ? (
                <X className="h-3 w-3" />
              ) : (
                <Menu className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-2 win98-inset">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="win98-button text-xs text-left"
                >
                  {item.label}
                </button>
              ))}
              <Link href="/register">
                <Button variant="ghost" size="sm" className="win98-button text-xs w-full justify-start">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Register
                </Button>
              </Link>
              <a href="/api/login">
                <Button variant="ghost" size="sm" className="win98-button text-xs w-full justify-start">
                  <LogIn className="h-3 w-3 mr-1" />
                  Login
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

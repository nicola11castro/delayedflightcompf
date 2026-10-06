import { useState } from "react";
import { Link } from "wouter";
import { Plane, Moon, Sun, Menu, X, UserPlus, LogIn, LogOut, User, FolderOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n";
import { BRAND_NAME } from "@shared/brand";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeContext();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { t, lang, setLang } = useLang();

  const navItems = [
    { href: "#claims", label: t("nav.submit") },
    { href: "#track", label: t("nav.track") },
    { href: "#calculator", label: t("nav.calculator") },
    { href: "#faq", label: t("nav.faq") },
  ];

  const scrollToSection = (href: string) => {
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/${href}`;
    }
    setIsMobileMenuOpen(false);
  };

  const languageButton = (
    <Button
      variant="ghost"
      size="sm"
      className="win98-button text-xs font-bold"
      onClick={() => setLang(lang === "en" ? "fr" : "en")}
      title={t("nav.languageTitle")}
      aria-label={t("nav.languageTitle")}
    >
      {t("nav.language")}
    </Button>
  );

  const authLinks = (mobile: boolean) => {
    const cls = `win98-button text-xs ${mobile ? "w-full justify-start" : ""}`;
    return isAuthenticated ? (
      <>
        <span className={`text-xs text-muted-foreground ${mobile ? "px-3 py-2" : "px-2"}`}>
          <User className="h-3 w-3 inline mr-1" />
          {user?.firstName || user?.email || "User"}
        </span>
        <Link href="/my-claims">
          <Button variant="ghost" size="sm" className={cls}>
            <FolderOpen className="h-3 w-3 mr-1" />
            {t("nav.myClaims")}
          </Button>
        </Link>
        {isAdmin && (
          <Link href="/admin">
            <Button variant="ghost" size="sm" className={cls}>
              <Shield className="h-3 w-3 mr-1" />
              {t("nav.admin")}
            </Button>
          </Link>
        )}
        <a href="/api/logout">
          <Button variant="ghost" size="sm" className={cls}>
            <LogOut className="h-3 w-3 mr-1" />
            {t("nav.logout")}
          </Button>
        </a>
      </>
    ) : (
      <>
        <Link href="/register">
          <Button variant="ghost" size="sm" className={cls}>
            <UserPlus className="h-3 w-3 mr-1" />
            {t("nav.register")}
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="sm" className={cls}>
            <LogIn className="h-3 w-3 mr-1" />
            {t("nav.login")}
          </Button>
        </Link>
      </>
    );
  };

  return (
    <nav className="bg-background border-b-2 sticky top-0 z-50" style={{ borderStyle: "inset", borderColor: "hsl(var(--border))" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <Link href="/" className="flex items-center space-x-2">
            <Plane className="text-primary text-lg" />
            <span className="font-bold text-sm text-foreground">{BRAND_NAME}</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => scrollToSection(item.href)} className="win98-button text-xs">
                {item.label}
              </button>
            ))}
            {authLinks(false)}
            {languageButton}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="win98-button" title={t("nav.theme")} aria-label={t("nav.theme")}>
              {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {languageButton}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="win98-button" aria-label={t("nav.theme")}>
              {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="win98-button" aria-label="Menu">
              {isMobileMenuOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-2 win98-inset">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <button key={item.href} onClick={() => scrollToSection(item.href)} className="win98-button text-xs text-left">
                  {item.label}
                </button>
              ))}
              {authLinks(true)}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

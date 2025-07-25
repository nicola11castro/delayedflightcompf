import { Plane, CheckCircle, Twitter, Facebook, Linkedin } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-background py-8" style={{borderTop: '2px inset', borderColor: 'hsl(var(--border))'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="win98-panel mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Plane className="text-primary text-lg" />
                <span className="font-bold text-sm">FlightClaim Pro</span>
              </div>
              <p className="text-muted-foreground mb-4 text-xs">
                Get the compensation you deserve for flight delays and cancellations. 
                Transparent 15% commission, no win no fee guarantee.
              </p>
              
              {/* Commission Summary */}
              <div className="win98-inset mb-4">
                <h4 className="font-bold mb-2 text-xs">Our Commission Promise</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-secondary mr-1 flex-shrink-0" />
                    Only 15% when you win
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-secondary mr-1 flex-shrink-0" />
                    No upfront costs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-secondary mr-1 flex-shrink-0" />
                    Transparent pricing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-secondary mr-1 flex-shrink-0" />
                    Direct deduction with POA
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-inter font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => scrollToSection('claims')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Submit Claim
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('track')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Track Status
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('calculator')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Commission Calculator
                </button>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  APPR Rights Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-inter font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Commission Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 FlightClaim Pro. All rights reserved. GDPR & PIPEDA compliant.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

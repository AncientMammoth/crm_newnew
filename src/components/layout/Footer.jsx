import React from 'react';
import { Link } from 'react-router-dom';

/* IMPORTANT: Ensure the "Inter" font is linked in your main HTML file,
  as mentioned in the Navbar update, for consistent typography.
*/

export default function Footer() {
  return (
    // 1. Updated footer to use the dark 'card' background and 'Inter' font
    <footer 
      className="bg-card border-t border-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          
          {/* 2. Replaced copyright text with Rian.io logo and updated text */}
          <div className="flex items-center gap-3">
            {/* Rian.io Logo Placeholder */}
            <img
              className="h-8 w-auto" // You can adjust the height (h-8) as needed
              src="/rian-logo-footer.svg"
              alt="Rian Logo"
            />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Rian.io. All rights reserved.
            </span>
          </div>

          {/* 3. Styled the existing links to match the new theme */}
          <div className="flex items-center space-x-6 text-sm">
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              Help
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              Privacy
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React, { useState, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Link, useLocation } from 'react-router-dom';

// Utility function for class names
const cn = (...inputs) => inputs.filter(Boolean).join(' ');

export default function DeliveryHeadNavbar() {
  const [userInitials, setUserInitials] = useState('');
  const location = useLocation();

  useEffect(() => {
    const user = localStorage.getItem("userName");
    if (user) {
        const names = user.split(' ');
        if (names.length > 1) {
            setUserInitials((names[0][0] + names[names.length - 1][0]).toUpperCase());
        } else if (names.length === 1 && names[0].length > 0) {
            setUserInitials(names[0][0].toUpperCase());
        }
    }
  }, [location]);

  const navigation = [
    { name: 'Dashboard', href: '/delivery-head/dashboard' },
    { name: 'All Project Deliveries', href: '/delivery-head/projects' },
  ];

  const userNavigation = [
    { name: 'Your Profile', href: '/profile' }, // Placeholder
    { name: 'Sign out', href: '/login' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full flex-shrink-0 items-center bg-card shadow-md">
      <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link to="/delivery-head/dashboard" className="flex items-center space-x-2">
            <img
              className="h-8 w-auto"
              src="/rian-logo-footer.svg"
              alt="Rian Logo"
            />
            <span className="text-foreground text-lg font-semibold">Delivery Head</span>
          </Link>

          {/* Main Navigation for Delivery Head */}
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="rounded-md px-3 py-2 text-sm font-light text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right-side User Menu */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="flex max-w-xs items-center rounded-full bg-card text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-card">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold border border-border">
                  {userInitials}
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-white ring-opacity-10 focus:outline-none">
                {userNavigation.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <Link
                        to={item.href}
                        className={cn(
                          active ? 'bg-secondary' : '',
                          'block px-4 py-2 text-sm text-foreground'
                        )}
                        onClick={() => {
                            if (item.name === 'Sign out') {
                                localStorage.removeItem('secretKey');
                                localStorage.removeItem('userName');
                                localStorage.removeItem('userRole');
                                localStorage.removeItem('userId');
                                // No other data needs to be cleared for delivery head as they don't manage accounts/projects/tasks/updates
                            }
                        }}
                      >
                        {item.name}
                      </Link>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}

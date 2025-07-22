import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Navigation links for the admin panel. "Tasks" is handled separately as a dropdown.
const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Accounts', href: '/admin/accounts' },
  { name: 'Projects', href: '/admin/projects' },
  { name: 'Updates', href: '/admin/updates' },
];

// Task-related links for the dropdown
const taskNavigation = [
    { name: 'All Tasks', href: '/admin/tasks' },
    { name: 'My Created Tasks', href: '/admin/my-tasks' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// A custom SVG logo component for "Rian"
const RianLogo = () => (
    <Link to="/" className="flex items-center space-x-2">
                <img
                  className="h-8 w-auto"
                  src="/rian-logo-footer.svg"
                  alt="Rian Logo"
                />
              </Link>
);

export default function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Disclosure as="nav" className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/admin/dashboard" className="hover:opacity-80 transition-opacity">
                    <RianLogo />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8 relative">
                  {/* Render standard navigation links */}
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className="relative inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {({ isActive }) => (
                        <>
                          <span>{item.name}</span>
                          {isActive && (
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                              layoutId="admin-underline"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}

                  {/* --- Tasks Dropdown Menu --- */}
                  <Menu as="div" className="relative inline-flex items-center">
                    <Menu.Button className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground group transition-colors">
                      <span>Tasks</span>
                      <ChevronDownIcon className="ml-1 h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-secondary py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none top-full">
                        {taskNavigation.map((item) => (
                             <Menu.Item key={item.name}>
                                {({ active }) => (
                                    <NavLink
                                    to={item.href}
                                    className={({ isActive }) => classNames(
                                        active || isActive ? 'bg-card text-foreground' : 'text-muted-foreground',
                                        'block px-4 py-2 text-sm'
                                    )}
                                    >
                                    {item.name}
                                    </NavLink>
                                )}
                            </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* --- Simplified Logout Button --- */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  <span>Logout</span>
                </button>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {[...navigation, ...taskNavigation].map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={NavLink}
                  to={item.href}
                  className={({ isActive }) => classNames(
                    isActive ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:border-gray-300 hover:bg-secondary hover:text-foreground',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-border pt-3 pb-3">
               <div className="space-y-1 px-2">
                <Disclosure.Button
                  as="button"
                  onClick={handleLogout}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Sign out
                </Disclosure.Button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

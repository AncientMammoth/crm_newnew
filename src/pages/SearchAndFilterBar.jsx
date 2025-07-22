import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SearchAndFilterBar({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  accountTypeOptions,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
      <input
        type="text"
        className="w-full sm:w-72 px-4 py-2 border border-border bg-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-foreground placeholder-muted-foreground"
        placeholder="Search accounts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="w-full sm:w-64">
        <Listbox value={typeFilter} onChange={setTypeFilter}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="block truncate text-foreground">
                  {typeFilter || "All Account Types"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 w-full overflow-auto rounded-lg bg-secondary py-1 text-sm shadow-lg ring-1 ring-border focus:outline-none max-h-60">
                  <Listbox.Option value="">
                    {({ selected, active }) => (
                      <div className={classNames(active ? "bg-primary/20 text-white" : "text-foreground", "cursor-default select-none relative py-2 px-4")}>
                        <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>
                            All Account Types
                        </span>
                      </div>
                    )}
                  </Listbox.Option>
                  {accountTypeOptions.map((type) => (
                    <Listbox.Option
                      key={type}
                      value={type}
                      className={({ active }) =>
                        classNames(
                          active ? "bg-primary/20 text-white" : "text-foreground",
                          "cursor-default select-none relative py-2 pl-10 pr-4"
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={classNames(
                              selected ? "font-semibold" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {type}
                          </span>
                          {selected && (
                            <span
                              className={classNames(
                                active ? "text-white" : "text-accent",
                                "absolute inset-y-0 left-0 flex items-center pl-3"
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
        </Listbox>
      </div>
    </div>
  );
}

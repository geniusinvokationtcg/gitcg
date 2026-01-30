import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react"

interface Column {
  key: string;
  title: string;
  isShown: boolean;
}

export function ColumnVisibilityDropdown({
  columns,
  onToggle,
  buttonText = "Columns"
}: {
  columns: Column[];
  onToggle: (key: string) => void;
  buttonText?: string;
}) {
  const [windowWidth, setWindowWidth] = useState<number>(0)
  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [])
  const buttonTextLength = buttonText.length;
  const maxLength = Math.max(...columns.map(col => col.title.length));
  
  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="flex justify-between items-center pl-4 pr-2 py-2 flex-row gap-2 text-xs bg-white border border-gray-300 rounded-sm text-gray-900
        hover:bg-gray-50 hover:border-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 hover:shadow-md focus:shadow-md
        transition-all duration-200 ease-in-out
        bg-[right_0.5rem_center] bg-[length:1rem] bg-no-repeat
        cursor-pointer"
      >
        {buttonText}
        <ChevronDownIcon className="size-3.5"/>
      </MenuButton>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        //Stupid code to fix body page get trimmed on right side when dropdown is open in Edge
        beforeEnter={() => {
          document.documentElement.style.overflowY = '';
          document.documentElement.style.paddingRight = '';
        }}
        afterLeave={() => {
          document.documentElement.style.overflowY = '';
          document.documentElement.style.paddingRight = '';
        }}
      >
        <MenuItems
          className={`absolute z-90 mt-2 whitespace-nowrap origin-top-right bg-white rounded-md shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none ${windowWidth < 768 && buttonTextLength < maxLength ? "left-0" : "right-0"}`}
        >
          <div className="py-1 max-h-[70vh] overflow-y-auto">
            {columns.map((column) => (
              <MenuItem key={column.key}>
                {() => (
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default behavior
                      e.stopPropagation(); // Stop event bubbling
                      onToggle(column.key);
                    }}
                    className={"hover:bg-gray-100 flex items-center w-full px-4 py-1.5 text-xs text-gray-700"}
                  >
                    <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                      column.isShown ? 'bg-gray-600 border-gray-600' : 'border-gray-400'
                    }`}>
                      {column.isShown && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      )}
                    </div>
                    <span>{column.title}</span>
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}

export function CustomSelect({
  options,
  value,
  onChange,
  className,
  listClassName,
  additionalClass
}: {
  options: { value: string | number; label: React.ReactNode }[];
  value: string | number;
  onChange: (value: any) => void;
  className?: string;
  listClassName?: string;
  additionalClass?: string
}) {

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`flex justify-between items-center pl-4 pr-2 py-2 flex-row gap-2
        ${
          className ||
          "text-xs bg-white border border-gray-300 rounded-sm text-gray-900 hover:bg-gray-50 hover:border-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 hover:shadow-md focus:shadow-md"
        }
        ${ additionalClass || "" }
        transition-all duration-200 ease-in-out
        bg-[right_0.5rem_center] bg-[length:1rem] bg-no-repeat
        cursor-pointer`}
      >
        {options.find(option => option.value === value)?.label ?? value}
        <ChevronDownIcon className="size-3.5"/>
      </MenuButton>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        //Stupid code to fix body page get trimmed on right side when dropdown is open in Edge (thanks deepseek (well i mean this whole file is generated by deepseek (i just modify it a bit))))
        beforeEnter={() => {
          document.documentElement.style.overflowY = '';
          document.documentElement.style.paddingRight = '';
        }}
        afterLeave={() => {
          document.documentElement.style.overflowY = '';
          document.documentElement.style.paddingRight = '';
        }}
      >
        <MenuItems className="absolute right-0 z-90 mt-2 w-auto min-w-full whitespace-nowrap origin-top-right bg-white rounded-md shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none">
          <div className="py-1 max-h-[70vh] overflow-y-auto">
            {options.map((option) => (
              <MenuItem key={option.value}>
                {() => (
                  <button
                    onClick={() => onChange(option.value)}
                    className={`flex items-center w-full px-4 py-1.5 ${listClassName || "text-xs text-gray-700 hover:bg-gray-100"}`}
                  >
                    {option.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
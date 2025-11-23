'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { Link } from '../i18n/navigation';
import { Locales } from "../utils/types"
import { LocaleSwitcher } from './LocaleSwitcher';

export default function Navbar({ locale }: {locale: Locales}) {
  const t = useTranslations("Navbar");
  
  const [isOpen, setIsOpen] = useState(false);
  const [desktopSubmenuOpen, setDesktopSubmenuOpen] = useState<string | null>(null);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);

  const navbarList = [
    { name: t("deck_builder"), path: "/casket" },
    { name: t("leaderboard"), path: "/leaderboard", target: "_self" },
    { name: t("tournament_data"), sub: [
      { name: t("weekly"), path: "/weekly" },
      { name: t("major"), path: "/major" }
    ] }
  ];
  
  return (
    <>
      <nav>
        <Link href="/">
          <img src="/logo.png" alt="GITCG Logo" className="w-16" />
        </Link>
        
        <div className="flex justify-center items-center gap-5">
          <ul className="navbar_menu_desktop">
            {navbarList.map((item) =>
              item.sub ? (
                <li key={item.name} className="relative group" onMouseEnter={() => setDesktopSubmenuOpen(item.name)} onMouseLeave={() => setDesktopSubmenuOpen(null)}>
                  <button className="navbar_menu_each flex items-center gap-1">
                    {item.name}
                    <ChevronDownIcon className="size-4"/>
                  </button>
                  <ul className={`absolute right-0 py-1 bg-white z-90 w-auto min-w-full whitespace-nowrap rounded-md shadow-lg ring-1 ring-gray-300 ring-opacity-5 focus:outline-none transition duration-100 ${desktopSubmenuOpen === item.name ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                    {item.sub.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          target={item.target || "_self"}
                          onClick={() => setDesktopSubmenuOpen(null)}
                          className="flex items-center w-full px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#AF7637]"
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    target={item.target || "_self"}
                    className="navbar_menu_each"
                  >
                    {item.name}
                  </Link>
                </li>
              )
            )}
          </ul>
          <LocaleSwitcher currentLocale={locale}/>
          <Bars3Icon className="md:hidden text-2xl size-6" onClick={() => setIsOpen(!isOpen)}/>
        </div>
      </nav>
      <div
        className={`fixed inset-0 bg-[#00000050] z-100 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white z-101 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center px-4 py-6 pr-8 border-b-1 border-b-gray-300 bg-[#F8E9C5]">
          <span className="font-semibold text-[18px]">{t("menu")}</span>
          <XMarkIcon className="size-6" onClick={() => setIsOpen(false)}/>
        </div>
        <ul className="flex flex-col space-y-4 p-4 text-gray-800 text-[17px]">
          {navbarList.map((item) =>
            item.sub ? (
              <li key={item.name}>
                <button
                  className="navbar_menu_each flex items-center gap-1"
                  onClick={() =>
                    setMobileSubmenuOpen(mobileSubmenuOpen === item.name ? null : item.name)
                  }
                >
                  {item.name}
                  {!mobileSubmenuOpen && <ChevronDownIcon className="size-4"/>}
                  {mobileSubmenuOpen && <ChevronUpIcon className="size-4"/>}
                </button>
                {mobileSubmenuOpen === item.name && (
                  <ul className="ml-4 mt-2 space-y-2">
                    {item.sub.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          target={item.target || "_self"}
                          className="navbar_menu_each"
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <li key={item.name}>
                <Link
                  href={item.path}
                  target={item.target || "_self"}
                  className="navbar_menu_each"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            )
          )}
        </ul>
      </div>
    </>
  );
}
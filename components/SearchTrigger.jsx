"use client";
import React from "react";
import { openSearchModal } from "./WebSearch";
import { useLanguage } from "./LanguageContext";

export default function SearchTrigger() {
  const { t } = useLanguage();
  return (
    <button
      onClick={openSearchModal}
      className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition mt-1 w-full text-left"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {t("nav.search")}
    </button>
  );
}

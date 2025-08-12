'use client';

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer>
      <p>
        {t("description")}
      </p>
      <div>
        <a
          href="https://discord.gg/GITCG"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_socmed_link"
        >
          Discord
        </a>
        <a
          href="https://x.com/invokationtcg"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_socmed_link"
        >
          X
        </a>
        <a
          href="https://www.reddit.com/r/GeniusInvokationTCG/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_socmed_link"
        >
          Reddit
        </a>
        <a
          href="https://www.youtube.com/@GITCG"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_socmed_link"
        >
          YouTube
        </a>
      </div>
    </footer>
  );
}
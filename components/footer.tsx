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
          href="/discord"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_socmed_link"
        >
          Discord
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
        <a
          href="https://twitch.tv/GITCG"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_socmed_link"
        >
          Twitch
        </a>
      </div>
    </footer>
  );
}
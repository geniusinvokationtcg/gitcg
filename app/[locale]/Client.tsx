"use client"

import { useTranslations } from "next-intl"
import { gameVersion } from "@/utils/version"
import "./homepage_style.css"
import { useState } from "react"
import { DialogBox } from "@/components/DialogBox"
import { Backdrop } from "@/components/Backdrop"

export default function HomePageClient () {
  const t = useTranslations()
  const h = useTranslations("HomePage")

  const [isOpen, setIsOpen] = useState(false);

  return <div className="w-[100vw]">
    <Backdrop isOpen={isOpen} triggerFn={() => setIsOpen(false)}/>
    <DialogBox isOpen={isOpen}>
      <div className="img_wrapper">
        <img src={`/graphic/schedule/${gameVersion.latest}.png`} className="object-scale-down" loading="lazy"/>
      </div>
    </DialogBox>

    <div className="home">
      <div className="flex flex-col items-center gap-3">
        <h1>{h("join_message")}</h1>
        <div className="flex flex-wrap gap-2 justify-center">
          <a className="join" href="/discord" target="_blank" rel="noopener noreferrer">{t("General.join")}</a>
          <button className="join" onClick={() => setIsOpen(!isOpen)}>{t("General.tournament_schedule")}</button>
        </div>
      </div>

      <div className="collapsible">
        <h3>{t("General.faq")}</h3>
        <details>
          <summary>{h("collapsible.find_tournament_channel_summary")}</summary>
          <div className="flex flex-col gap-2">
            <p>
              {h.rich("collapsible.find_tournament_channel_content", {
                roles_channel: () => <span className="strong">#roles</span>,
                other_roles_section: () => <span className="strong">Other Roles</span>,
                direct_link: (chunk) => <a className="clickable_text" href="https://discord.com/channels/1016377670348587058/1098572911230582934/1098692503613485167" target="_blank" rel="noopener noreferrer">{chunk}</a>,
                trophy_emoji: () => <span className="icon">{DiscordTrophyEmoji}</span>,
                role_name: () => <span className="strong">Access: Tournaments</span>,
                tournaments_channel: () => <a className="strong" href="https://discord.com/channels/1016377670348587058/1049254049356197908" target="_blank" rel="noopener noreferrer">#tournaments</a>
              })}
            </p>
            <img src="/guide/gitcg_roles.png" loading="lazy"/>
          </div>
        </details>

        <details>
          <summary>{h("collapsible.tournament_rule_summary")}</summary>
          <p>
            {h.rich("collapsible.tournament_rule_content", {
              link: (chunk) => <a className="clickable_text" href="https://docs.google.com/document/d/e/2PACX-1vQ4W5Y8tiyESiY_YuivQdA41opojddHKYrm24ZXMdWvPOk9jVe7MQlQTgsqZEMRf_rcNvv0LeiBhobm/pub#h.lif2jlgklgrv" target="_blank" rel="noopener noreferrer">{chunk}</a>
            })}
          </p>
        </details>
      </div>
      
    </div>

  </div>
  
}

const DiscordTrophyEmoji = <svg className="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="#FFAC33" d="M5.123 5h6C12.227 5 13 4.896 13 6V4c0-1.104-.773-2-1.877-2h-8c-2 0-3.583 2.125-3 5 0 0 1.791 9.375 1.917 9.958C2.373 18.5 4.164 20 6.081 20h6.958c1.105 0-.039-1.896-.039-3v-2c0 1.104-.773 2-1.877 2h-4c-1.104 0-1.833-1.042-2-2S3.539 7.667 3.539 7.667C3.206 5.75 4.018 5 5.123 5zm25.812 0h-6C23.831 5 22 4.896 22 6V4c0-1.104 1.831-2 2.935-2h8c2 0 3.584 2.125 3 5 0 0-1.633 9.419-1.771 10-.354 1.5-2.042 3-4 3h-7.146C21.914 20 22 18.104 22 17v-2c0 1.104 1.831 2 2.935 2h4c1.104 0 1.834-1.042 2-2s1.584-7.333 1.584-7.333C32.851 5.75 32.04 5 30.935 5zM20.832 22c0-6.958-2.709 0-2.709 0s-3-6.958-3 0-3.291 10-3.291 10h12.292c-.001 0-3.292-3.042-3.292-10z"/><path fill="#FFCC4D" d="M29.123 6.577c0 6.775-6.77 18.192-11 18.192-4.231 0-11-11.417-11-18.192 0-5.195 1-6.319 3-6.319 1.374 0 6.025-.027 8-.027l7-.001c2.917-.001 4 .684 4 6.347z"/><path fill="#C1694F" d="M27 33c0 1.104.227 2-.877 2h-16C9.018 35 9 34.104 9 33v-1c0-1.104 1.164-2 2.206-2h13.917c1.042 0 1.877.896 1.877 2v1z"/><path fill="#C1694F" d="M29 34.625c0 .76.165 1.375-1.252 1.375H8.498C7.206 36 7 35.385 7 34.625v-.25C7 33.615 7.738 33 8.498 33h19.25c.759 0 1.252.615 1.252 1.375v.25z"/></svg>
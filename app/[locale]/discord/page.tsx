import { redirect } from "next/navigation";

export const discordPermalink = "https://discord.gg/VnsErdQA2y"

export default function DiscordRedirect() {
  redirect(discordPermalink)
}
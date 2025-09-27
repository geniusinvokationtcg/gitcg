import { redirect } from "next/navigation";

export default function DiscordRedirect() {
  redirect(discordPermalink)
}

const discordPermalink = "https://discord.gg/VnsErdQA2y"
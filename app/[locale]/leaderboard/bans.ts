import { BannedPlayer } from "@/utils/types"
import { gameVersion } from "@/utils/version"

const banned: BannedPlayer[] = [
  {
    //maks
    playerid: 46,
    uid: [721705568],
    starting: "5-5",
    ending: "current"
  },
  {
    //sinamia (maks alt)
    playerid: 145,
    uid: [647886027],
    starting: "5-6",
    ending: "current"
  },
  {
    //AIR
    playerid: 6,
    uid: [601354487, 768199815, 811278716],
    starting: "5-4",
    ending: "5-5"
  },
  {
    //CLANNAD (AIR alt)
    playerid: 24,
    uid: [601354487, 768199815, 811278716],
    starting: "5-4",
    ending: "5-5"
  },
  {
    //Kanon (AIR alt)
    playerid: 71,
    uid: [601354487, 768199815, 811278716],
    starting: "5-4",
    ending: "5-5"
  }
]

export function getBannedPlayers(version: string) {
  const bannedPlayers: BannedPlayer[] = []
  banned.map(p => {
    const startingIndex = gameVersion.available.indexOf(p.starting)
    const endingIndex = !p.ending ? startingIndex : (p.ending === "current" ? gameVersion.available.length-1 : gameVersion.available.indexOf(p.ending))

    if(startingIndex<0 || endingIndex<0) return;

    const versionIndex = gameVersion.available.indexOf(version)
    if(versionIndex >= startingIndex && versionIndex <= endingIndex){
      bannedPlayers.push(p)
    }
  })

  return bannedPlayers
}
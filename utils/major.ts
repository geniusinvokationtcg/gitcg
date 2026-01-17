import { MajorData, Seeding, MajorPlayer } from "./types";
import { prefixStatusRegEx } from "./vars";

export const getWinner = (matchid: number, data: MajorData, games: number[][], seeding: Seeding) => {
  const match = data.bracket.find(m => m.matchid === matchid);

  if(match && match.enforce_winner) return match.enforce_winner;
  
  const score1 = match?.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const score2 = match?.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);
  const minWins = ((match?.best_of || NaN)+1)/2
  if(match?.is_bye){
    const roundIndex = games.findIndex(r => r.includes(matchid))
    const indexCurrentRound = games[roundIndex].indexOf(matchid)
    if(roundIndex === 0) return data.players.find(p => p.seed === seeding[indexCurrentRound][0]) ? 1 : (data.players.find(p => p.seed === seeding[indexCurrentRound][1]) ? 2 : NaN)
  }
  return score1 === minWins ? 1 : (score2 === minWins ? 2 : NaN)
}

export const getPlayer = (matchid: any, player: number, data: MajorData, games: number[][], seeding: Seeding): MajorPlayer | undefined => {
  if(typeof matchid !== "number") return;
  if(player !== 1 && player !== 2) return;
  let roundIndex = games.findIndex(r => r.includes(matchid));
  let indexCurrentRound = games[roundIndex].indexOf(matchid);
  if(indexCurrentRound < 0) return;
  if(roundIndex > 0){
    const indexPrevRound = (indexCurrentRound+1)*2 - (player % 2) - 1
    const newMatchId = games[roundIndex-1][indexPrevRound]
    const prevRoundWinner = getWinner(newMatchId, data, games, seeding)
    return getPlayer(newMatchId, prevRoundWinner, data, games, seeding)
  }
  const playerSeed = seeding[indexCurrentRound][player - 1]
  let playerDetail = data.players.find(p => p.seed === playerSeed);
  if(playerDetail) playerDetail.name = playerDetail.name.replace(prefixStatusRegEx, "")
  return playerDetail
}

export function getRoundNameKey(top: number):string {
  switch(top){
    case 2:
      return "final";
    case 4:
      return "semifinal";
    default:
      return "round_of_x";
  }
}
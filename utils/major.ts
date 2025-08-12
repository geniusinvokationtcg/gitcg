import { MajorData, Seeding, MajorPlayer } from "./types";

export const getWinner = (matchid: number, data: MajorData) => {
  const match = data.bracket.find(m => m.matchid === matchid);
  const score1 = match?.games.reduce((s, game) => (game.winner === 1 ? s+1 : s), 0);
  const score2 = match?.games.reduce((s, game) => (game.winner === 2 ? s+1 : s), 0);
  const minWins = ((match?.best_of || NaN)+1)/2
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
    const prevRoundWinner = getWinner(newMatchId, data)
    return getPlayer(newMatchId, prevRoundWinner, data, games, seeding)
  }
  const playerSeed = seeding[indexCurrentRound][player - 1]
  return data.players.find(p => p.seed === playerSeed);
}
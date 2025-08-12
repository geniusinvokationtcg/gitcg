import { MatchData, DeckData, PlayerDataWithResult } from "./types";
import { decode } from "./decoder";

/**
 * 
 * @param data - The data parsed from CSV.
 * @param char - (optional) If omitted, return data for all unique charactersas array.
 * @returns 
 */
export function compileDeckData(data: MatchData[], char?: string): DeckData[] | DeckData {
  if(char) return calculateDeckStat(data, char);
  return extractUniqueCharacters(data).map((c) => {
    return calculateDeckStat(data, c);
  });
}

function extractDataByMatch(data: MatchData[]) {
  return data.filter(row => row.isIncluded === true);
}

function extractUniqueCharacters(data: MatchData[]) {
  const characters = data.flatMap(row => [row.characters1, row.characters2]);
  return [...new Set(characters)].filter(char => typeof char === "string" && char !== "");
}

function extractDataByPlayer(data: MatchData[]) {
  const seen = new Map();
  data.forEach(row => {
    const key = `${row.player1}||${row.characters1}||${row.week}||${row.server}`;
    if(!seen.has(key)) seen.set(key, {
      player: row.player1,
      deckcode: row.deckcode1,
      characters: row.characters1,
      server: row.server,
      week: row.week
    });
  });
  data.filter(row => !row.isBye).forEach(row => {
    const key = `${row.player2}||${row.characters2}||${row.week}||${row.server}`;
    if(!seen.has(key)) seen.set(key, {
      player: row.player2,
      deckcode: row.deckcode2,
      characters: row.characters2,
      server: row.server,
      week: row.week
    });
  });
  return Array.from(seen.values());
}

function calculateDeckStat(data: MatchData[], char: string): DeckData {
  const firstDeckcode = data.find(row => row.characters1 === char)?.deckcode1 || data.find(row => row.characters2 === char)?.deckcode2 || "";
  const decodedCardNames = decode(firstDeckcode, "name").data || [];
  const decodedCardId = decode(firstDeckcode, "id").data || [];

  const playerDataByChar = extractDataByPlayer(data).filter(row => row.characters === char);

  const playerDataByCharWithResult: PlayerDataWithResult[] = playerDataByChar.map(row => ({
    ...row,
    w: data.reduce((a, r) => {
      if(r.player1 === row.player && r.characters1 === char && r.week === row.week && r.server === row.server) a += r.score1;
      if(r.player2 === row.player && r.characters2 === char && r.week === row.week && r.server === row.server) a += r.score2;
      return a;
    }, 0),
    t: data.reduce((a, r) => {
      if(r.player1 === row.player && r.characters1 === char && r.week === row.week && r.server === row.server && r.isTie) a += 1;
      if(r.player2 === row.player && r.characters2 === char && r.week === row.week && r.server === row.server && r.isTie) a += 1;
      return a;
    }, 0),
    l: data.reduce((a, r) => {
      if(r.player1 === row.player && r.characters1 === char && r.week === row.week && r.server === row.server && r.score1 === 0 && !r.isTie) a += 1;
      if(r.player2 === row.player && r.characters2 === char && r.week === row.week && r.server === row.server && r.score2 === 0 && !r.isTie) a += 1;
      return a;
    }, 0)
  }));
  const bestW = Math.max(...playerDataByCharWithResult.map(row => row.w));
  const playerDataByCharWithResultFilteredWin = playerDataByCharWithResult.filter(row => row.w === bestW);
  const bestT = Math.max(...playerDataByCharWithResultFilteredWin.map(row => row.t));
  const bestL = Math.max(...playerDataByCharWithResultFilteredWin.filter(row => row.t === bestT).map(row => row.l));
  //top decks are decks that scores 4 wins or more
  const numberOfTopDecks = playerDataByCharWithResult.filter(row => row.w >= 4).length;
  const rateOfTopDecks = playerDataByCharWithResult.length === 0 ? 0 : numberOfTopDecks/playerDataByCharWithResult.length;

  const dataByMatch = extractDataByMatch(data);
  const usageMatch = dataByMatch.filter(row => row.characters1 === char).length
    + dataByMatch.filter(row => row.characters2 === char).length;
  const totalMatch = dataByMatch.length*2;
  const winCount = dataByMatch.filter(row => row.characters1 === char && row.score1 === 1).length
    + dataByMatch.filter(row => row.characters2 === char && row.score2 === 1).length;
  const winRate = usageMatch === 0 ? 0 : winCount/usageMatch;

  const usageMatchNoMirror = dataByMatch.filter(row => row.characters1 === char && !row.isMirror).length
    + dataByMatch.filter(row => row.characters2 === char && !row.isMirror).length;
  const winCountNoMirror = dataByMatch.filter(row => row.characters1 === char && row.score1 === 1 && !row.isMirror).length
    + dataByMatch.filter(row => row.characters2 === char && row.score2 === 1 && !row.isMirror).length;
  const winRateNoMirror = usageMatchNoMirror === 0 ? 0 : winCountNoMirror/usageMatchNoMirror;

  const dataByPlayer = extractDataByPlayer(data);

  return {
    character1: decodedCardNames[0].toString() || "",
    character2: decodedCardNames[1].toString() || "",
    character3: decodedCardNames[2].toString() || "",
    characterId1: Number(decodedCardId[0]),
    characterId2: Number(decodedCardId[1]),
    characterId3: Number(decodedCardId[2]),
    usage_player: playerDataByChar.length,
    usage_rate_player: dataByPlayer.length === 0 ? 0 : playerDataByChar.length/dataByPlayer.length,
    bestW: bestW,
    bestT: bestT,
    bestL: bestL,
    n_top_deck: numberOfTopDecks,
    rate_top_deck: rateOfTopDecks,
    stderr_top_deck: playerDataByChar.length === 0 ? 0 : Math.sqrt(rateOfTopDecks*(1-rateOfTopDecks)/playerDataByChar.length),
    usage_match: usageMatch,
    usage_rate_match: totalMatch === 0 ? 0 : usageMatch/totalMatch,
    win_count: winCount,
    win_rate: winRate,
    stderr: usageMatch === 0 ? 0 : Math.sqrt(winRate*(1-winRate)/usageMatch),
    win_count_nomirror: winCountNoMirror,
    win_rate_nomirror: winRateNoMirror,
    stderr_nomirror: usageMatchNoMirror === 0 ? 0 : Math.sqrt(winRateNoMirror*(1-winRateNoMirror)/usageMatchNoMirror),
    tie_count: dataByMatch.filter(row => row.characters1 === char && row.isTie).length
      + dataByMatch.filter(row => row.characters2 === char && row.isTie).length
  }
}
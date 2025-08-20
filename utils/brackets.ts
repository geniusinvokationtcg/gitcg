import { Maybe, SuccessResult, ErrorResult } from "@/utils/types"
import { Seeding, MajorData } from "./types"

export function generateSeeding (max_players: number): Maybe<Seeding> {
  if(max_players < 2) return ErrorResult("Invalid max players.");
  if(max_players > 32) return ErrorResult("This only supports max 32 players for now. This thing is complicated to code ayahah")
  const numOfRound = Math.ceil(Math.log2(max_players));
  const numOfPlayer = 2**numOfRound;

  const pairs: Seeding = [];
  for(let i = 1; i <= numOfPlayer/2; i++){
    pairs.push([i, numOfPlayer + 1 - i])
  }
  const pairsLength = pairs.length;

  const firstHalf: Seeding = [];
  const secondHalf: Seeding = [];
  let firstHalfGoesFirst = true;
  let firstHalfCount = 1;
  let secondHalfCount = 0;
  for(let i = 0; i < pairsLength; i++){
    if(pairs.length === 0) break;

    const mod = i % 4;
    if(firstHalfGoesFirst){
      if(mod === 0){ firstHalf.push(pairs.shift()!) }
      else if(mod === 1){ firstHalf.push(pairs.pop()!) }
      else if(mod === 2){
        const mid = pairs.splice(pairs.length/2-1, 2);
        firstHalf.push(...mid);
      }
    } else {
      if(mod === 0){ secondHalf.push(pairs.shift()!) }
      else if(mod === 1){ secondHalf.push(pairs.pop()!) }
      else if(mod === 2){
        const mid = pairs.splice(pairs.length/2-1, 2);
        secondHalf.push(...mid);
      }
    }
    if(mod === 3){
      if(firstHalfGoesFirst){
        firstHalfCount++;
        if(firstHalfCount === 2){
          firstHalfCount = 0
          firstHalfGoesFirst = !firstHalfGoesFirst;
        }
      } else {
        secondHalfCount++;
        if(secondHalfCount === 2){
          secondHalfCount = 0
          firstHalfGoesFirst = !firstHalfGoesFirst;
        }
      }
    }
  }

  return SuccessResult([...firstHalf, ...secondHalf]);
}

export function generateRoundStructure (max_players: number) {
  const seeding = generateSeeding(max_players).data;
  const maxRound = Math.ceil(Math.log2(max_players));
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
  const games: number[][] = [];
  rounds.map(round => {
    const n = max_players/(2**round)
    if(games.length === 0) {
      const g = Array.from({ length: n }, (_, i) => i + 1);
      games.push(g);
    }
    else {
      const g = Array.from({ length: n }, (_, i) => i + 1 + games.at(-1)!.at(-1)!);
      games.push(g);
    }
  })
  return { seeding, maxRound, rounds, games }
}
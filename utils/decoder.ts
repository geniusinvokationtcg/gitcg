import cardsData from "@/cards.json";
import { Maybe, SuccessResult, ErrorResult } from "@/utils/types"

const scrambling = [
	[0, 1, 4],
	[5, 8, 9],
	[12, 13, 16],
	[17, 20, 21],
	[24, 25, 28],
	[29, 32, 33],
	[36, 37, 40],
	[41, 44, 45],
	[48, 49, 52],
	[53, 56, 57],
	[60, 61, 64],
	[65, 68, 69],
	[72, 73, 76],
	[77, 80, 81],
	[84, 85, 88],
	[89, 92, 93],
	[96, 97, 2],
	[3, 6, 7],
	[10, 11, 14],
	[15, 18, 19],
	[22, 23, 26],
	[27, 30, 31],
	[34, 35, 38],
	[39, 42, 43],
	[46, 47, 50],
	[51, 54, 55],
	[58, 59, 62],
	[63, 66, 67],
	[70, 71, 74],
	[75, 78, 79],
	[82, 83, 86],
	[87, 90, 91],
	[94, 95, 98],
]

export function decode(code: string, output: "name" | "id" | "code" | null | undefined): Maybe<number[] | string[]> {
	if(!output) output = "code";
  let buffer = Buffer.from(code, 'base64');
	let hex_code = buffer.toString('hex');

	if (hex_code.length !== 102) return ErrorResult("This is not a valid deck code");

	let bytes = [];
	for (let i = 0; i < hex_code.length; i += 2) {
		let byte = hex_code[i] + hex_code[i + 1];
		bytes.push(byte);
	}

	let offset = parseInt(bytes[bytes.length - 1], 16);
	let scrambled = hex_offset(bytes, -offset).join("");
	let unscrambled = [];

	for (let i = 0; i < scrambling.length; i++) {
		unscrambled.push(scrambling[i].map(s => scrambled[s]).join(""));
	}

	if (unscrambled.length !== 33) return ErrorResult("This is not a valid deck code");

	let deck: number[] = unscrambled.map(s => parseInt(s, 16));
  if(output !== "code"){
    Cards.refresh();
    if(output === "name") return SuccessResult( deck.map(s => Cards.codes.find(c => c.code === s)?.[output]).filter((v): v is string => typeof v === "string") as string[] );
    if(output === "id") return SuccessResult( deck.map(s => Cards.codes.find(c => c.code === s)?.[output]).filter((v): v is number => typeof v === "number") as number[] );
  };
	return SuccessResult(deck as number[]);
}

export function decodeAndSortActionCards(deckcode: string): number[] {
  const decoded = decode(deckcode, "id").data as number[];
  const characters = decoded.splice(0, 3); //decoded becomes the action cards after splicing
  decoded.sort((a, b) => { return a-b } );
  return [...characters, ...decoded];
}

export function toText(deck: number[]): Maybe<string> {
	let grouped: Map<number, number> = new Map();
	deck.forEach(v => grouped.set(v, (grouped.get(v) ?? 0) + 1));

	let entries = Array.from(grouped.entries());
	let characters = [];
	let text = "";

	Cards.refresh();
  
  for (let [code, count] of entries.slice(0, 3)) {
		let name = Cards.characters.find(c => c.code === code)?.name;
		if (name === undefined) return ErrorResult(`Could not find a card with code: ${code}\nThis is likely because my code isn't updated yet`);
		characters.push(name);
	}

	for (let [code, count] of entries.slice(3)) {
		let name = Cards.actions.find(c => c.code === code)?.name;
		if (name === undefined) return ErrorResult(`Could not find a card with code: ${code}\nThis is likely because my code isn't updated yet`);
		text += `\n${count} - ${name}`;
	}

	text = characters.join(" - ") + text;
	return SuccessResult(text);
}

function hex_offset(bytes: string[], offset: number) {
	let new_bytes = bytes.map(hex => {
		let byte = parseInt(hex, 16);
		byte = (byte + offset + 256) % 256;
		return byte.toString(16).padStart(2, '0');
	})

	return new_bytes;
}

class Cards {
  static parsed: any;
  static codes: Card[];
  static characters: Card[];
  static actions: Card[];

  static refresh() {
    Cards.parsed = cardsData;
    Cards.codes = Cards.parsed.codes;
    Cards.characters = Cards.codes.filter((c: Card) => c.type === "character");
    Cards.actions = Cards.codes.filter((c: Card) => c.type === "action").sort((a, b) => a.id - b.id);
  }
}

type Card = {
  name: string,
  id: number,
  code: number,
  type: "character" | "action",
}
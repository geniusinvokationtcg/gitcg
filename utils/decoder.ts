import cardsData from "@/cards.json";
import { Maybe, SuccessResult, ErrorResult, Elements, Tuple } from "@/utils/types"
import { isArcaneLegend, elementResonance, tribeResonance, getElement, talents } from "./cards";

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

export function encode(deck: number[], offset: number = 0): string {
	let unscrambled = deck.map(d => d.toString(16).padStart(3, '0'));
	let scrambled: string[] = [];

	for (let i = 0; i < scrambling.length; i++) {
		scrambling[i].forEach((s, j) => {
			scrambled[s] = unscrambled[i][j];
		})
	}

	scrambled.push("0", "0", "0");

	let bytes = [];
	for (let i = 0; i < scrambled.length; i += 2) {
		let byte = scrambled[i] + scrambled[i + 1];
		bytes.push(byte);
	}

	let hex_code = hex_offset(bytes, offset).join("");
	let buffer = Buffer.from(hex_code, 'hex');
	let code = buffer.toString('base64');
	return code;
}

export function decode(code: string, output?: "name" | "id" | "code", bypassError: boolean = false): Maybe<number[] | string[]> {
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

	if (unscrambled.length !== 33 && !bypassError) return ErrorResult("This is not a valid deck code");

	Cards.refresh();

	let deck: number[] = unscrambled.map(s => parseInt(s, 16));
	if(!deck.some(s => Cards.codes.find(c => c.code === s)) && !bypassError) return ErrorResult("This deckcode contains nonexisting cards");
	
	if(output === "code") return SuccessResult(deck);

	let nonCode: unknown[] = [];
	if(output === "name") nonCode = deck.map(s => Cards.codes.find(c => c.code === s)?.[output]);
	if(output === "id") nonCode = deck.map(s => Cards.codes.find(c => c.code === s)?.[output]);

	if(bypassError) nonCode = nonCode.filter(s => s !== undefined);
	if(nonCode.includes(undefined)) return ErrorResult("This deckcode contains nonexisting cards");
	return SuccessResult(nonCode as number[] | string[]);
}

export function decodeAndSortActionCards(deckcode: string): number[] {
  const decoded = (decode(deckcode, "id").data ?? []) as number[];
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

export function isValidDeckcode(deckcode: string): { result: boolean; reason: string } {
	const FalseResult = (reason: string) => ({result: false, reason: reason})

	if(deckcode.length !== 68) return FalseResult("Wrong deckcode length")

	const decoded = decode(deckcode, "id")
	if(decoded.error) return FalseResult(decoded.error.message)

	Cards.refresh()
	
	const deck = decoded.data as Tuple<number, 33>
	const characters = deck.slice(0, 3) as Tuple<number, 3>
	const actions = deck.slice(3) as Tuple<number, 30>
	if(actions.length !== 30) return FalseResult("Insufficient cards")
	actions.sort((a, b) => a-b)

	//check if the card id corresponds to each correct card types (this should also check if each card id actually exists)
	if(characters.some(id => Cards.codes.find(c => c.id === id)?.type !== "character")) return FalseResult("Invalid character cards")
	if(actions.some(id => Cards.codes.find(c => c.id === id)?.type !== "action")) return FalseResult("Invalid action cards")

	//check duplicate characters
	if(new Set(characters).size !== characters.length) return FalseResult("Duplicate character")

	//check each action card to only have max 2 copies (max 1 for arcane legend)
	const groupedActions: Map<number, number> = new Map()
	actions.forEach(id => groupedActions.set(id, (groupedActions.get(id) ?? 0) + 1))
	const groupedActionsArr = Array.from(groupedActions.entries())
	if(groupedActionsArr.some(([id, count]) => isArcaneLegend(id) ? count>1 : count>2)) return FalseResult("Exceeding copy of action cards")

	//check elemental resonance
	for(let res of elementResonance){
		if(!actions.some(id => res.card_id.includes(id))) continue;
		const eligibleCharacterCount = characters.reduce((a, r) => getElement(cardsData.characters.find(c => c.id === r)?.element_type ?? NaN) === res.element ? a+1 : a, 0)
		if(eligibleCharacterCount < 2) return FalseResult("Ineligible elemental resonance")
	}

	//check tribe resonance
	for(let res of tribeResonance){
		if(!actions.some(id => res.card_id.includes(id))) continue;
		const eligibleCharacterCount = characters.reduce((a, r) => cardsData.characters.find(c => c.id === r)?.belongs.includes(res.tribe) ? a+1 : a, 0)
		if(eligibleCharacterCount < 2) return FalseResult("Ineligible tribe resonance")
	}

	//check talents (the id for talents is 2xxxxx)
	const talentCards = groupedActionsArr.filter(([id, count]) => id < 300000)
	if(talentCards.length > 0){
		for(let [id, count] of talentCards){
			const t = talents.find(t => t.talent_id === id)
			if(!t) return FalseResult("Talent card doesn't exist")
			if(!characters.includes(t.character_id)) return FalseResult("Ineligible talent card")
		}
	}

	return {result: true, reason: "OK"}
}

interface Talent {
	character_id: number
	character_name: string
	talent_id: number
	talent_name: string
}
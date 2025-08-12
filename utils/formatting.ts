export function percentize(n: number | string, locale: string): string{
  if(typeof n === "string") n = parseFloat(n);
  return `${(n*100).toLocaleString(locale,{
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`
}
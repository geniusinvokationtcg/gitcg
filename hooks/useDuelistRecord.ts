import { parseCSVIgnoreErr } from "@/utils/csvParse";
import { DuelistRecord } from "@/utils/types";
import { duelistRecordUrl, prefixStatusRegEx, weeklyMatchdataHeader } from "@/utils/vars";
import { useQuery } from "@tanstack/react-query";

export function useDuelistRecord() {
  const DRQuery = useQuery({
    queryKey: ["duelist_record"],
    queryFn: () => parseCSVIgnoreErr<DuelistRecord>(duelistRecordUrl, weeklyMatchdataHeader)
  })

  return DRQuery.data
    ? DRQuery.data.filter(duelist => !!duelist.playerid).map(duelist => ({ ...duelist, handle_display: duelist.handle_display.toString().replace(prefixStatusRegEx, "") }))
    : null
}
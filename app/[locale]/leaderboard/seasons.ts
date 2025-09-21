import { Season, Seasons } from "@/utils/types"

export const seasons: Seasons = {
  na: [
    {
      versions: ["5-6", "5-8", "6-0"],
      best_finish: 6,
      qualification_type: "top_8"
    },
    {
      versions: ["5-3", "5-4", "5-5"],
      best_finish: 6,
      qualification_type: "top_8"
    },
    ...commonSeasons("pre5-3")
  ],
  eu: [
    {
      versions: ["6-0", "6-1", "6-2"],
      best_finish: 5,
      qualification_type: "top_8"
    },
    {
      versions: ["5-5", "5-6", "5-8"],
      best_finish: 6,
      qualification_type: "top_8"
    },
    {
      versions: ["5-3", "5-4"],
      best_finish: 4,
      qualification_type: "top_8"
    },
    ...commonSeasons("pre5-3")
  ],
  as: [
    {
      versions: ["5-8", "6-0", "6-1"],
      best_finish: 5,
      qualification_type: "top_8"
    },
    {
      versions: ["5-4", "5-5", "5-6"],
      best_finish: 6,
      qualification_type: "top_8"
    },
    {
      versions: ["5-3"],
      best_finish: 2,
      qualification_type: "top_8"
    },
    ...commonSeasons("pre5-3")
  ]
}

function commonSeasons(key: string): Season[] {
  if(key === "pre5-3") return [
    {
      versions: ["5-2"],
      is_hidden: true
    }
  ]
  return []
}
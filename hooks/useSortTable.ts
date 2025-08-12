import { useState } from "react";

export function useSortTable<T>() {
  const [sortKey, setSortKey] = useState<null | keyof T>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  
  const handleSort = (key: null | keyof T) => {
    if(sortKey !== key) { setSortKey(key); setSortAsc(false); }
    else if(sortKey === key && !sortAsc) { setSortAsc(true); }
    else { setSortKey(null); setSortAsc(false); }
  };

  return {
    sortKey,
    sortAsc,
    handleSort
  }
}
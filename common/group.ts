const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const groupIndexToString = (index: number): string => {
  return groupNames[index];
}

export const stringToGroupIndex = (string: string): number | null => {
  const index = groupNames.indexOf(string);
  if (index == -1) return null;
  return index;
}

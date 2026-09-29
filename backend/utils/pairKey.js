export const getPairKey = (firstUserId, secondUserId) =>
  [String(firstUserId), String(secondUserId)].sort().join("_");
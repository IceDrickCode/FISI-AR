// Compare all geometric matches. Similar sign layouts must not win simply
// because their target index occurs first in the catalogue.
export function chooseBestMatch(candidates) {
  const ranked = candidates.filter(c => Number.isInteger(c.inliers) && c.inliers >= 6 && c.modelViewTransform).sort((a,b) => b.inliers-a.inliers);
  if (!ranked.length) return null;
  const best=ranked[0], second=ranked[1];
  if (second && best.inliers-second.inliers < Math.max(2,Math.ceil(best.inliers*0.05))) return null;
  return best;
}

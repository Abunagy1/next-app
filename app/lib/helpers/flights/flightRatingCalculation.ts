export function flightRatingCalculation(flightReviewObjArr: any[]): number {
  const rating = flightReviewObjArr.reduce((acc, review) => acc + +review?.rating, 0);
  return rating / flightReviewObjArr.length;
}
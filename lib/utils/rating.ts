// Stars appear on the website only once a restaurant has this many ratings, so one or two
// ratings can't make (or break) a restaurant's score. The admin always sees the real numbers.
export const MIN_RATINGS_TO_SHOW = 5;

// What customers see for a restaurant: null until it has enough ratings.
export function publicRating(restaurant: {
  rating_avg: number | null;
  rating_count: number;
}): { avg: string; count: number } | null {
  if (restaurant.rating_avg === null || restaurant.rating_count < MIN_RATINGS_TO_SHOW) return null;
  return { avg: Number(restaurant.rating_avg).toFixed(1), count: restaurant.rating_count };
}

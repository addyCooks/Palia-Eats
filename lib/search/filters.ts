// Search filters (v2 8c): sort, diet, cuisine and a price range. Shared by the search page
// (server, which filters the results) and the filters sheet (browser, which counts
// "Show 12 dishes" while you tap). The filters live in the address, e.g.
// /search?q=biryani&sort=rating&diet=veg&cuisine=Biryani&min=100&max=250

export const SORTS = [
  { key: "relevance", label: "Relevance" },
  { key: "rating", label: "Rating" },
  { key: "fastest", label: "Fastest" },
  { key: "price", label: "Price: low" },
] as const;
export type Sort = (typeof SORTS)[number]["key"];

// No "Jain" option: dishes don't record that.
export const DIETS = [
  { key: "veg", label: "Pure veg" },
  { key: "egg", label: "Egg" },
  { key: "nonveg", label: "Non-veg" },
] as const;
export type Diet = (typeof DIETS)[number]["key"];

export type SearchFilters = {
  sort: Sort;
  diet: Diet[];
  cuisine: string[];
  min: number | null;
  max: number | null;
};

export const NO_FILTERS: SearchFilters = { sort: "relevance", diet: [], cuisine: [], min: null, max: null };

type Params = Record<string, string | string[] | undefined>;

// "a,b" or ?x=a&x=b -> ["a", "b"]
function list(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function amount(value: string | string[] | undefined): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 0 && value !== undefined && value !== "" ? Math.round(n) : null;
}

export function parseFilters(params: Params): SearchFilters {
  const sort = typeof params.sort === "string" && SORTS.some((s) => s.key === params.sort) ? (params.sort as Sort) : "relevance";
  const diet = list(params.diet).filter((d): d is Diet => DIETS.some((option) => option.key === d));
  const cuisine = list(params.cuisine).map((c) => c.slice(0, 40));
  let min = amount(params.min);
  let max = amount(params.max);
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  return { sort, diet: [...new Set(diet)], cuisine: [...new Set(cuisine)], min, max };
}

// How many filters are on (sort not counted: it's always visible as chips).
export function activeFilterCount(filters: SearchFilters): number {
  return filters.diet.length + filters.cuisine.length + (filters.min !== null || filters.max !== null ? 1 : 0);
}

export function searchHref(query: string, filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.diet.length) params.set("diet", filters.diet.join(","));
  if (filters.cuisine.length) params.set("cuisine", filters.cuisine.join(","));
  if (filters.min !== null) params.set("min", String(filters.min));
  if (filters.max !== null) params.set("max", String(filters.max));
  const text = params.toString();
  return text ? `/search?${text}` : "/search";
}

// The few facts about a dish that the filters look at.
export type FilterableDish = {
  price: number;
  is_veg: boolean;
  contains_egg: boolean;
  cuisines: string[]; // its restaurant's cuisines
};

export function dietOf(dish: Pick<FilterableDish, "is_veg" | "contains_egg">): Diet {
  return dish.is_veg ? "veg" : dish.contains_egg ? "egg" : "nonveg";
}

export function matchesFilters(dish: FilterableDish, filters: SearchFilters): boolean {
  if (filters.diet.length && !filters.diet.includes(dietOf(dish))) return false;
  if (filters.cuisine.length && !dish.cuisines.some((c) => filters.cuisine.includes(c))) return false;
  const price = Number(dish.price);
  if (filters.min !== null && price < filters.min) return false;
  if (filters.max !== null && price > filters.max) return false;
  return true;
}

// Slider ends: the cheapest and dearest dish, rounded out to ₹10.
export function priceBounds(dishes: Pick<FilterableDish, "price">[]): { low: number; high: number } | null {
  if (dishes.length === 0) return null;
  const prices = dishes.map((d) => Number(d.price));
  const low = Math.floor(Math.min(...prices) / 10) * 10;
  const high = Math.ceil(Math.max(...prices) / 10) * 10;
  return high > low ? { low, high } : null;
}

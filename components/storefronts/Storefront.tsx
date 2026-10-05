import type { ComponentType } from "react";
import { DefaultStorefront } from "@/components/storefronts/DefaultStorefront";
import type { StorefrontProps } from "@/components/storefronts/types";

// Custom restaurant designs register here, keyed by the restaurant's
// "Custom design key" (template_key) in the admin. Example for later:
//
//   import { BrownPizzaStorefront } from "@/components/storefronts/brown-pizza";
//   const customStorefronts = { "brown-pizza": BrownPizzaStorefront };
//
// Restaurants without a key (or with an unknown key) get the default design.
const customStorefronts: Record<string, ComponentType<StorefrontProps>> = {};

export function Storefront(props: StorefrontProps) {
  const key = props.restaurant.template_key;
  const Custom = key ? customStorefronts[key] : undefined;

  return Custom ? <Custom {...props} /> : <DefaultStorefront {...props} />;
}

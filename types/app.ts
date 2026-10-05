export type UserRole = "customer" | "admin";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
};

export type Address = {
  id: string;
  user_id: string;
  label: string;
  address_line: string;
  landmark: string | null;
  phone: string | null;
  is_default: boolean;
};

export type RestaurantTheme = {
  brand?: string;
  brandDark?: string;
};

// A row of the public `restaurants` table.
export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  about: string | null;
  cuisine_tags: string[];
  phone: string | null;
  address_text: string | null;
  logo_url: string | null;
  cover_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  closed_days: number[]; // weekdays closed, 0 = Sunday ... 6 = Saturday
  min_order_amount: number;
  delivery_fee: number;
  theme: RestaurantTheme;
  template_key: string | null;
  is_accepting_orders: boolean;
  is_active: boolean;
};

// Admin-only fields (table `restaurant_private`).
export type RestaurantPrivate = {
  notification_email: string | null;
  notification_phone: string | null;
  panel_key_created_at: string | null;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  sort_order: number;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_id: string;
  restaurant_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: "cod";
  customer_name: string;
  customer_phone: string;
  delivery_address: {
    label: string;
    address_line: string;
    landmark: string | null;
    phone: string | null;
  };
  customer_notes: string | null;
  rejection_reason: string | null;
  channel: "web" | "whatsapp";
  cancelled_by: "restaurant" | "admin" | "customer" | null;
  placed_at: string;
  status_updated_at: string;
};

export type OrderWithDetails = Order & {
  order_items: OrderItem[];
  restaurants: { name: string; slug: string; phone: string | null } | null;
};

export type AdminRestaurant = Restaurant & {
  restaurant_private: RestaurantPrivate | null;
};

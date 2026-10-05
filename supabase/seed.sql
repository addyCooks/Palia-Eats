-- PaliaEats: sample data for development ONLY. Do not run in production.
-- Run in Supabase Dashboard -> SQL Editor AFTER 0001_schema.sql.

insert into public.restaurants
  (slug, name, tagline, description, cuisine_tags, phone, address_text,
   opening_time, closing_time, min_order_amount, delivery_fee,
   theme)
values
  ('brown-pizza', 'Brown Pizza', 'Hot, cheesy and made fresh',
   'Wood-fired style pizzas and sides, made to order.',
   array['Pizza', 'Italian', 'Fast food'], '9000000001', 'Main Road, Palia',
   '10:00', '22:00', 150.00, 30.00,
   '{"brand": "#92400e", "brandDark": "#78350f"}'),
  ('blue-cafe', 'Blue Cafe', 'Coffee, snacks and good vibes',
   'A cosy cafe with coffee, sandwiches and desserts.',
   array['Cafe', 'Snacks', 'Desserts'], '9000000002', 'Market Road, Palia',
   '08:00', '21:00', 100.00, 20.00,
   '{"brand": "#1d4ed8", "brandDark": "#1e3a8a"}');

-- Private notification emails (a private row is auto-created for each restaurant).
-- Replace with real emails when you onboard a restaurant.
update public.restaurant_private rp
set notification_email = v.email
from public.restaurants r
join (values
  ('brown-pizza', 'brown-pizza@example.com'),
  ('blue-cafe', 'blue-cafe@example.com')
) as v (slug, email) on v.slug = r.slug
where rp.restaurant_id = r.id;

-- Categories
insert into public.menu_categories (restaurant_id, name, sort_order)
select r.id, c.name, c.sort_order
from public.restaurants r
join (values
  ('brown-pizza', 'Pizzas', 1),
  ('brown-pizza', 'Sides', 2),
  ('brown-pizza', 'Drinks', 3),
  ('blue-cafe', 'Coffee', 1),
  ('blue-cafe', 'Snacks', 2),
  ('blue-cafe', 'Desserts', 3)
) as c (slug, name, sort_order) on c.slug = r.slug;

-- Menu items
insert into public.menu_items
  (restaurant_id, category_id, name, description, price, is_veg, sort_order)
select r.id, mc.id, i.name, i.description, i.price, i.is_veg, i.sort_order
from (values
  ('brown-pizza', 'Pizzas', 'Margherita', 'Classic tomato, mozzarella and basil', 199.00, true, 1),
  ('brown-pizza', 'Pizzas', 'Farmhouse', 'Capsicum, onion, tomato and mushroom', 279.00, true, 2),
  ('brown-pizza', 'Pizzas', 'Chicken Tikka', 'Spicy chicken tikka with onions', 329.50, false, 3),
  ('brown-pizza', 'Sides', 'Garlic Bread', 'Toasted with garlic butter', 99.00, true, 1),
  ('brown-pizza', 'Drinks', 'Cold Drink', '300 ml', 40.00, true, 1),
  ('blue-cafe', 'Coffee', 'Cappuccino', 'Rich espresso with steamed milk', 120.00, true, 1),
  ('blue-cafe', 'Coffee', 'Cold Coffee', 'Chilled, blended with ice cream', 140.00, true, 2),
  ('blue-cafe', 'Snacks', 'Veg Sandwich', 'Grilled with cheese and veggies', 110.00, true, 1),
  ('blue-cafe', 'Snacks', 'Chicken Sandwich', 'Grilled chicken with mayo', 150.00, false, 2),
  ('blue-cafe', 'Desserts', 'Brownie', 'Warm chocolate brownie', 90.99, true, 1)
) as i (slug, category, name, description, price, is_veg, sort_order)
join public.restaurants r on r.slug = i.slug
join public.menu_categories mc
  on mc.restaurant_id = r.id and mc.name = i.category;

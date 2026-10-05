# Turning on WhatsApp for PaliaEats

The code for WhatsApp ordering and order updates is already live. It stays **switched off** until you
give it the keys below. Nothing breaks while it is off: the website and emails work as usual, and WhatsApp
messages are simply skipped (you can see that on the admin **Emails** page).

PaliaEats uses the **official WhatsApp Business Cloud API** from Meta.

## What you get

- **Customers can order on WhatsApp**: they message the PaliaEats number, browse restaurants and menus,
  build a cart, check out (cash on delivery) and track the order. These orders are the same as website
  orders: same prices, hours, days off, minimum order and delivery fee checks.
- **Order updates on WhatsApp** (cooking, out for delivery, delivered, cancelled with the reason) for
  customers who ordered on WhatsApp, and for website customers who tick *"Send my order updates on
  WhatsApp"* on their account page.
- Customers can reply **STOP** at any time to switch updates off.
- Each restaurant's **Share** page shows a WhatsApp link that opens the bot straight on that restaurant's menu.

Restaurants are still told about new orders by **email** (no WhatsApp for restaurants yet).

## One-time setup (about 1 to 3 days, mostly waiting for Meta)

1. **Meta developer account and app.** Go to <https://developers.facebook.com>, create an app of type
   **Business**, and add the **WhatsApp** product.
2. **A phone number.** Meta gives you a free *test number* to try things. For real customers, add a real
   phone number that is **not** already registered on WhatsApp, and complete **Business verification** in
   Meta Business Settings (Meta may take a few days).
3. **Collect four values**, then give them to the developer (never paste them in public chats):

   | Setting | Where to find it |
   |---|---|
   | `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp > API Setup, under the phone number |
   | `WHATSAPP_ACCESS_TOKEN` | For testing, API Setup shows a 24-hour token. For real use create a **System User** in Business Settings, give it the WhatsApp permissions, and generate a **permanent token** |
   | `WHATSAPP_APP_SECRET` | App settings > Basic > App secret |
   | `WHATSAPP_VERIFY_TOKEN` | Any long random text you make up (you type the same text into Meta in the next step) |

4. **Connect the webhook.** In WhatsApp > Configuration, set:
   - Callback URL: `https://paliaeats.in/api/whatsapp/webhook` (use `https://paliaeats.vercel.app/...` until the domain is connected)
   - Verify token: the same text as `WHATSAPP_VERIFY_TOKEN`
   - Then **subscribe to the `messages` field**.
5. **Create one message template** (needed to message someone who has not written to us in the last
   24 hours, which is a WhatsApp rule). In WhatsApp > Message templates:
   - Name: `order_update`, Category: **Utility**, Language: English
   - Body: `Update on your order #{{1}} from {{2}}: {{3}}`
   - Examples: `1042`, `Blue Cafe`, `is on its way.`
   - Wait for **Approved**, then set `WHATSAPP_TEMPLATE_ORDER_UPDATE=order_update`.
6. **Set the values on Vercel** (Project > Settings > Environment Variables) and redeploy:
   `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`,
   `WHATSAPP_TEMPLATE_ORDER_UPDATE`, and `NEXT_PUBLIC_WHATSAPP_NUMBER` (the customer-facing number,
   digits only with country code, e.g. `919876543210`).
7. **Try it.** From your own phone, message the number: `hi`.

## Good to know

- **Cost.** Meta charges per conversation (a small amount per 24 hours in India). The first 1,000
  service conversations a month are free. Template messages are charged separately. See Meta's pricing page.
- **24-hour rule.** Inside 24 hours of a customer's last message we send normal text. Outside that,
  only the approved template can be sent. Without the template, those updates are skipped and logged.
- **Local testing.** Setting `WHATSAPP_DRY_RUN=true` (development only) prints messages to the server
  console instead of sending them.
- **India only.** The bot takes orders from Indian (+91) numbers.
- **WhatsApp customers have no website login.** They are kept as normal customers (visible in the admin
  **Customers** page as "WhatsApp customer") so their orders and saved addresses work the same way.

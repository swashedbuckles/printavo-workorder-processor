# Printavo Workorder Processor

Convert customer workorders from other Printavo accounts into your own Printavo account automatically.

## Features
- 🕷️ **Web Scraping**: Extracts customer data, line items, and order details
- 🔐 **Secure**: Uses your own Printavo credentials, no data storage
- 🚀 **Simple**: One-page web interface, no technical knowledge required
- 💰 **Free**: Runs on Render.com free tier

## How It Works
1. Customer sends you a workorder URL (like: `customer-shop.printavo.com/work_orders/abc123`)
2. You enter your Printavo credentials and paste the URL
3. App scrapes the workorder data automatically
4. Creates a new customer and order in your Printavo account
5. You get a direct link to view the new order

## Quick Start

### Local Development
```bash
git clone https://github.com/yourusername/printavo-workorder-processor
cd printavo-workorder-processor
npm install
npm run dev
```

Open http://localhost:3000

### Deploy to Render (Free)
1. Fork this repository
2. Connect to Render.com
3. Deploy with default settings
4. Done! Your app will be live at `your-app-name.onrender.com`

## Required Information
- **Printavo Email**: Your login email
- **API Token**: Generate from My Account > Generate API Key in Printavo
- **User ID**: Your user ID in Printavo
- **Order Status ID**: ID of your default "New Order" status

## Supported Workorder Formats
Works with public workorder URLs from any Printavo account:
- `subdomain.printavo.com/work_orders/[hash]`

## Example Usage
**Input**: `https://model-citizen-brand-provisions.printavo.com/work_orders/68f503de509b3a260070a7b003f0f09a`

**Output**: New customer and order created in your account with:
- Customer contact information
- Shipping address
- Line items with descriptions and quantities
- Production notes

## Security
- ✅ No credentials stored on server
- ✅ All communication over HTTPS
- ✅ Only accesses public workorder URLs
- ✅ Uses your own Printavo API access

## Troubleshooting

### Common Issues
- **"Could not extract customer information"**: The workorder might be private or have an unusual format
- **"Printavo API issue"**: Check your credentials and API token
- **"Network issue"**: Workorder URL might be incorrect or inaccessible

### Getting Help
1. Check that the workorder URL is publicly accessible
2. Verify your Printavo credentials are correct
3. Make sure your API token hasn't expired (6-month limit)

## Maintenance
This is designed to be low-maintenance:
- Auto-deploys from GitHub
- Runs on free hosting tier
- Simple monitoring via Render dashboard

## License
MIT - Feel free to modify for your needs

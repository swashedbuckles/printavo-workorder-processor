const express = require('express');
const path = require('path');
const PrintavoWorkorderScraper = require('./PrintavoWorkorderScraper');

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Workorder Processor',
    pageTitle: '🔄 Workorder Processor',
    subtitle: 'Convert customer workorders into your Printavo account'
  });
});

// API endpoint for processing workorders
app.post('/api/process-workorder', async (req, res) => {
  const { printavoEmail, printavoToken, userId, orderStatusId, workorderUrl } = req.body;
  
  // Validate inputs
  if (!printavoEmail || !printavoToken || !userId || !orderStatusId || !workorderUrl) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }
  
  // Validate workorder URL format
  if (!workorderUrl.includes('printavo.com/work_orders/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid workorder URL format. Expected: [subdomain].printavo.com/work_orders/[hash]'
    });
  }
  
  try {
    // Create scraper instance
    const scraper = new PrintavoWorkorderScraper({
      email: printavoEmail,
      token: printavoToken
    });
    
    // Process the workorder
    const result = await scraper.processWorkorder(workorderUrl, userId, orderStatusId);
    
    // Return result
    res.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Test scraper endpoint - just scrape, don't create anything
app.post('/api/test-scraper', async (req, res) => {
  const { workorderUrl } = req.body;
  
  // Validate input
  if (!workorderUrl) {
    return res.status(400).json({
      success: false,
      error: 'Workorder URL is required'
    });
  }
  
  // Validate workorder URL format
  if (!workorderUrl.includes('printavo.com/work_orders/') && !workorderUrl.includes('printavo.com/invoice/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format. Expected: [subdomain].printavo.com/work_orders/[hash] or [subdomain].printavo.com/invoice/[hash]'
    });
  }
  
  try {
    // Create scraper instance (no credentials needed for testing)
    const scraper = new PrintavoWorkorderScraper({
      email: 'test@example.com',
      token: 'test-token'
    });
    
    console.log(`Testing scraper on: ${workorderUrl}`);
    
    // Just scrape the workorder data
    const workorderData = await scraper.scrapeWorkorder(workorderUrl);
    
    // Return the scraped data with analysis
    res.json({
      success: true,
      url: workorderUrl,
      extractedData: workorderData,
      analysis: {
        customerDataFound: !!(workorderData.firstName || workorderData.company || workorderData.customerEmail),
        lineItemsFound: workorderData.lineItems?.length || 0,
        addressFound: !!(workorderData.shippingAddress?.address1 || workorderData.shippingAddress?.city),
        contactInfoFound: !!(workorderData.customerEmail || workorderData.customerPhone),
        productionNotesFound: !!workorderData.productionNotes,
        readyForImport: (workorderData.lineItems?.length > 0) && 
                       (workorderData.firstName || workorderData.company || workorderData.customerEmail)
      },
      recommendations: generateRecommendations(workorderData),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scraper test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      url: workorderUrl,
      details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to generate recommendations based on scraped data
function generateRecommendations(data) {
  const recommendations = [];
  
  if (!data.firstName && !data.company) {
    recommendations.push({
      type: 'warning',
      message: 'No customer name or company found. You may need to manually add this information.'
    });
  }
  
  if (!data.customerEmail && !data.customerPhone) {
    recommendations.push({
      type: 'warning', 
      message: 'No contact information found. Consider reaching out to get email or phone.'
    });
  }
  
  if (data.lineItems?.length === 0) {
    recommendations.push({
      type: 'error',
      message: 'No line items found. Cannot create order without products.'
    });
  }
  
  if (!data.shippingAddress?.address1 && !data.shippingAddress?.city) {
    recommendations.push({
      type: 'info',
      message: 'No shipping address found. You may need to request this from the customer.'
    });
  }
  
  if (data.lineItems?.some(item => !item.unitPrice || item.unitPrice === 0)) {
    recommendations.push({
      type: 'info',
      message: 'Some line items have no pricing. You\'ll need to add pricing before creating the order.'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'All required data found! Ready to import into Printavo.'
    });
  }
  
  return recommendations;
}

// Test page for scraper
app.get('/test', (req, res) => {
  res.render('test', {
    title: 'Scraper Test Tool',
    pageTitle: '🧪 Workorder Scraper Test Tool',
    subtitle: 'Test the web scraper without creating any orders. See what data can be extracted from workorder URLs.'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Workorder processor running on port ${port}`);
  console.log(`📱 Open http://localhost:${port} to use the app`);
});

module.exports = app;

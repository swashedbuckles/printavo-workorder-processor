const express = require('express');
const path = require('path');
const PrintavoWorkorderScraper = require('./PrintavoWorkorderScraper');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workorder Processor</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .container { max-width: 800px; margin-top: 50px; }
        .form-label { font-weight: 600; }
        .alert { margin-top: 20px; }
        .spinner-border { width: 1rem; height: 1rem; }
        .progress { height: 25px; margin: 20px 0; }
        .result-section { margin-top: 30px; }
        .extracted-data { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        pre { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-10">
                <h1 class="text-center mb-4">🔄 Workorder Processor</h1>
                <p class="text-center text-muted mb-4">
                    Convert customer workorders into your Printavo account
                </p>

                <form id="workorderForm">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">🔐 Your Printavo Account Details</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="printavoEmail" class="form-label">Printavo Email</label>
                                        <input type="email" class="form-control" id="printavoEmail" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="printavoToken" class="form-label">API Token</label>
                                        <input type="password" class="form-control" id="printavoToken" required>
                                        <div class="form-text">Get this from My Account > Generate API Key</div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="userId" class="form-label">Your User ID</label>
                                        <input type="number" class="form-control" id="userId" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="orderStatusId" class="form-label">Default Order Status ID</label>
                                        <input type="number" class="form-control" id="orderStatusId" required>
                                        <div class="form-text">ID for "New Order" or similar status</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-3">
                        <div class="card-header">
                            <h5 class="mb-0">📄 Customer Workorder</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="workorderUrl" class="form-label">Workorder URL</label>
                                <input type="url" class="form-control" id="workorderUrl" required
                                       placeholder="https://customer-shop.printavo.com/work_orders/abc123...">
                                <div class="form-text">
                                    Example: https://model-citizen-brand-provisions.printavo.com/work_orders/68f503de509b3a260070a7b003f0f09a
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="d-grid gap-2 mt-4">
                        <button type="submit" class="btn btn-primary btn-lg" id="submitBtn">
                            🚀 Process Workorder
                        </button>
                    </div>
                </form>

                <!-- Progress Section -->
                <div id="progressSection" style="display: none;">
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 0%"></div>
                    </div>
                    <div class="text-center">
                        <span id="progressText">Starting...</span>
                    </div>
                </div>

                <!-- Results Section -->
                <div id="resultsSection" class="result-section" style="display: none;"></div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('workorderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const submitBtn = document.getElementById('submitBtn');
            const progressSection = document.getElementById('progressSection');
            const resultsSection = document.getElementById('resultsSection');
            const progressBar = document.querySelector('.progress-bar');
            const progressText = document.getElementById('progressText');
            
            // Disable form and show progress
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processing...';
            progressSection.style.display = 'block';
            resultsSection.style.display = 'none';
            
            // Collect form data
            const formData = {
                printavoEmail: document.getElementById('printavoEmail').value,
                printavoToken: document.getElementById('printavoToken').value,
                userId: parseInt(document.getElementById('userId').value),
                orderStatusId: parseInt(document.getElementById('orderStatusId').value),
                workorderUrl: document.getElementById('workorderUrl').value
            };
            
            try {
                // Simulate progress updates
                let progress = 10;
                const updateProgress = (percent, text) => {
                    progressBar.style.width = percent + '%';
                    progressText.textContent = text;
                };
                
                updateProgress(10, 'Validating inputs...');
                
                // Make the API call
                const response = await fetch('/api/process-workorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                updateProgress(30, 'Scraping workorder data...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
                
                updateProgress(60, 'Creating customer...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                updateProgress(80, 'Creating order...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const result = await response.json();
                
                updateProgress(100, 'Complete!');
                
                // Show results
                if (result.success) {
                    resultsSection.innerHTML = \`
                        <div class="alert alert-success">
                            <h5>✅ Success!</h5>
                            <p>\${result.message}</p>
                            <hr>
                            <p class="mb-0">
                                <strong>Customer:</strong> \${result.customer.first_name} \${result.customer.last_name} 
                                (<a href="https://www.printavo.com/customers/\${result.customer.id}" target="_blank">View Customer</a>)
                                <br>
                                <strong>Order:</strong> #\${result.order.id} 
                                (<a href="\${result.order.url}" target="_blank">View in Printavo</a>)
                            </p>
                        </div>
                        <div class="extracted-data">
                            <h6>📊 Extracted Data:</h6>
                            <pre>\${JSON.stringify(result.workorderData, null, 2)}</pre>
                        </div>
                    \`;
                } else {
                    resultsSection.innerHTML = \`
                        <div class="alert alert-danger">
                            <h5>❌ Error</h5>
                            <p>\${result.error}</p>
                            \${result.details ? \`<details><summary>Technical Details</summary><pre>\${result.details}</pre></details>\` : ''}
                        </div>
                    \`;
                }
                
                resultsSection.style.display = 'block';
                
            } catch (error) {
                resultsSection.innerHTML = \`
                    <div class="alert alert-danger">
                        <h5>❌ Network Error</h5>
                        <p>Failed to connect to the server: \${error.message}</p>
                    </div>
                \`;
                resultsSection.style.display = 'block';
            } finally {
                // Re-enable form
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Process Workorder';
                setTimeout(() => {
                    progressSection.style.display = 'none';
                }, 2000);
            }
        });
    </script>
</body>
</html>
  `);
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
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scraper Test Tool</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .container { max-width: 1000px; margin-top: 30px; }
        .json-output { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; max-height: 600px; overflow-y: auto; }
        pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; }
        .recommendation { margin: 5px 0; padding: 8px 12px; border-radius: 4px; }
        .recommendation.success { background: #d1edff; border-left: 4px solid #28a745; }
        .recommendation.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .recommendation.error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .recommendation.info { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .spinner-border { width: 1rem; height: 1rem; }
        .analysis-section { margin: 20px 0; }
        .badge { margin-right: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col-md-12">
                <h1 class="mb-4">🧪 Workorder Scraper Test Tool</h1>
                <p class="text-muted mb-4">
                    Test the web scraper without creating any orders. See what data can be extracted from workorder URLs.
                </p>

                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">🔍 Test Scraper</h5>
                    </div>
                    <div class="card-body">
                        <form id="testForm">
                            <div class="mb-3">
                                <label for="workorderUrl" class="form-label">Workorder or Invoice URL</label>
                                <input type="url" class="form-control" id="workorderUrl" required
                                       placeholder="https://customer-shop.printavo.com/work_orders/abc123... or .../invoice/abc123...">
                                <div class="form-text">
                                    <strong>Example URLs:</strong><br>
                                    • https://model-citizen-brand-provisions.printavo.com/work_orders/68f503de509b3a260070a7b003f0f09a<br>
                                    • https://armadillo.printavo.com/invoice/970f2fac2b7cc91f95de5fd5a4a3c37f
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" id="testBtn">
                                🚀 Test Scraper
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Results Section -->
                <div id="resultsSection" style="display: none;">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">📊 Scraping Results</h5>
                            <button class="btn btn-sm btn-outline-secondary" onclick="copyToClipboard()">
                                📋 Copy JSON
                            </button>
                        </div>
                        <div class="card-body">
                            <!-- Analysis Section -->
                            <div id="analysisSection" class="analysis-section"></div>
                            
                            <!-- Recommendations Section -->
                            <div id="recommendationsSection"></div>
                            
                            <!-- Raw Data Section -->
                            <h6>🔍 Extracted Data:</h6>
                            <div class="json-output">
                                <pre id="jsonOutput"></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let lastResult = null;

        document.getElementById('testForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const testBtn = document.getElementById('testBtn');
            const resultsSection = document.getElementById('resultsSection');
            const workorderUrl = document.getElementById('workorderUrl').value;
            
            // Show loading state
            testBtn.disabled = true;
            testBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Testing...';
            resultsSection.style.display = 'none';
            
            try {
                const response = await fetch('/api/test-scraper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ workorderUrl })
                });
                
                const result = await response.json();
                lastResult = result;
                
                // Show analysis
                displayAnalysis(result);
                
                // Show recommendations
                displayRecommendations(result.recommendations || []);
                
                // Show raw JSON
                document.getElementById('jsonOutput').textContent = JSON.stringify(result, null, 2);
                resultsSection.style.display = 'block';
                
            } catch (error) {
                document.getElementById('jsonOutput').textContent = JSON.stringify({
                    error: 'Network error: ' + error.message,
                    timestamp: new Date().toISOString()
                }, null, 2);
                resultsSection.style.display = 'block';
            } finally {
                testBtn.disabled = false;
                testBtn.innerHTML = '🚀 Test Scraper';
            }
        });

        function displayAnalysis(result) {
            const analysisSection = document.getElementById('analysisSection');
            
            if (result.success && result.analysis) {
                const analysis = result.analysis;
                analysisSection.innerHTML = \`
                    <h6>📈 Data Analysis:</h6>
                    <div class="mb-3">
                        <span class="badge \${analysis.customerDataFound ? 'bg-success' : 'bg-danger'}">\${analysis.customerDataFound ? '✅' : '❌'} Customer Data</span>
                        <span class="badge \${analysis.lineItemsFound > 0 ? 'bg-success' : 'bg-danger'}">\${analysis.lineItemsFound > 0 ? '✅' : '❌'} Line Items (\${analysis.lineItemsFound})</span>
                        <span class="badge \${analysis.addressFound ? 'bg-success' : 'bg-warning'}">\${analysis.addressFound ? '✅' : '⚠️'} Address</span>
                        <span class="badge \${analysis.contactInfoFound ? 'bg-success' : 'bg-warning'}">\${analysis.contactInfoFound ? '✅' : '⚠️'} Contact Info</span>
                        <span class="badge \${analysis.productionNotesFound ? 'bg-success' : 'bg-secondary'}">\${analysis.productionNotesFound ? '✅' : '—'} Production Notes</span>
                        <span class="badge \${analysis.readyForImport ? 'bg-success' : 'bg-danger'} fs-6">\${analysis.readyForImport ? '🚀 READY TO IMPORT' : '🚫 NEEDS WORK'}</span>
                    </div>
                \`;
            } else {
                analysisSection.innerHTML = \`
                    <div class="alert alert-danger">
                        <strong>❌ Scraping Failed:</strong> \${result.error || 'Unknown error'}
                    </div>
                \`;
            }
        }

        function displayRecommendations(recommendations) {
            const recommendationsSection = document.getElementById('recommendationsSection');
            
            if (recommendations && recommendations.length > 0) {
                const recommendationHtml = recommendations.map(rec => \`
                    <div class="recommendation \${rec.type}">
                        <strong>\${getRecommendationIcon(rec.type)}</strong> \${rec.message}
                    </div>
                \`).join('');
                
                recommendationsSection.innerHTML = \`
                    <h6>💡 Recommendations:</h6>
                    \${recommendationHtml}
                    <hr>
                \`;
            } else {
                recommendationsSection.innerHTML = '';
            }
        }

        function getRecommendationIcon(type) {
            switch(type) {
                case 'success': return '✅';
                case 'warning': return '⚠️';
                case 'error': return '❌';
                case 'info': return 'ℹ️';
                default: return '•';
            }
        }

        function copyToClipboard() {
            if (lastResult) {
                navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
                
                // Show feedback
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }
        }
    </script>
</body>
</html>
  `);
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
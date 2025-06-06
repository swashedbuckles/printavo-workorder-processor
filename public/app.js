// public/app.js

// Main workorder processing form
if (document.getElementById('workorderForm')) {
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            updateProgress(60, 'Creating customer...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            updateProgress(80, 'Creating order...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const result = await response.json();
            
            updateProgress(100, 'Complete!');
            
            // Show results
            if (result.success) {
                resultsSection.innerHTML = `
                    <div class="alert alert-success">
                        <h5>✅ Success!</h5>
                        <p>${result.message}</p>
                        <hr>
                        <p class="mb-0">
                            <strong>Customer:</strong> ${result.customer.first_name} ${result.customer.last_name} 
                            (<a href="https://www.printavo.com/customers/${result.customer.id}" target="_blank">View Customer</a>)
                            <br>
                            <strong>Order:</strong> #${result.order.id} 
                            (<a href="${result.order.url}" target="_blank">View in Printavo</a>)
                        </p>
                    </div>
                    <div class="extracted-data">
                        <h6>📊 Extracted Data:</h6>
                        <pre>${JSON.stringify(result.workorderData, null, 2)}</pre>
                    </div>
                `;
            } else {
                resultsSection.innerHTML = `
                    <div class="alert alert-danger">
                        <h5>❌ Error</h5>
                        <p>${result.error}</p>
                        ${result.details ? `<details><summary>Technical Details</summary><pre>${result.details}</pre></details>` : ''}
                    </div>
                `;
            }
            
            resultsSection.style.display = 'block';
            
        } catch (error) {
            resultsSection.innerHTML = `
                <div class="alert alert-danger">
                    <h5>❌ Network Error</h5>
                    <p>Failed to connect to the server: ${error.message}</p>
                </div>
            `;
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
}

// Test scraper form
if (document.getElementById('testForm')) {
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
            analysisSection.innerHTML = `
                <h6>📈 Data Analysis:</h6>
                <div class="mb-3">
                    <span class="badge ${analysis.customerDataFound ? 'bg-success' : 'bg-danger'}">${analysis.customerDataFound ? '✅' : '❌'} Customer Data</span>
                    <span class="badge ${analysis.lineItemsFound > 0 ? 'bg-success' : 'bg-danger'}">${analysis.lineItemsFound > 0 ? '✅' : '❌'} Line Items (${analysis.lineItemsFound})</span>
                    <span class="badge ${analysis.addressFound ? 'bg-success' : 'bg-warning'}">${analysis.addressFound ? '✅' : '⚠️'} Address</span>
                    <span class="badge ${analysis.contactInfoFound ? 'bg-success' : 'bg-warning'}">${analysis.contactInfoFound ? '✅' : '⚠️'} Contact Info</span>
                    <span class="badge ${analysis.productionNotesFound ? 'bg-success' : 'bg-secondary'}">${analysis.productionNotesFound ? '✅' : '—'} Production Notes</span>
                    <span class="badge ${analysis.readyForImport ? 'bg-success' : 'bg-danger'} fs-6">${analysis.readyForImport ? '🚀 READY TO IMPORT' : '🚫 NEEDS WORK'}</span>
                </div>
            `;
        } else {
            analysisSection.innerHTML = `
                <div class="alert alert-danger">
                    <strong>❌ Scraping Failed:</strong> ${result.error || 'Unknown error'}
                </div>
            `;
        }
    }

    function displayRecommendations(recommendations) {
        const recommendationsSection = document.getElementById('recommendationsSection');
        
        if (recommendations && recommendations.length > 0) {
            const recommendationHtml = recommendations.map(rec => `
                <div class="recommendation ${rec.type}">
                    <strong>${getRecommendationIcon(rec.type)}</strong> ${rec.message}
                </div>
            `).join('');
            
            recommendationsSection.innerHTML = `
                <h6>💡 Recommendations:</h6>
                ${recommendationHtml}
                <hr>
            `;
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

    // Make copyToClipboard available globally for test page
    window.copyToClipboard = function() {
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
}

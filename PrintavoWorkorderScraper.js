const puppeteer = require('puppeteer');
const axios = require('axios');

class PrintavoWorkorderScraper {
  constructor(yourPrintavoCredentials) {
    this.email = yourPrintavoCredentials.email;
    this.token = yourPrintavoCredentials.token;
    this.apiBase = 'https://www.printavo.com/api/v1';
  }

  /**
   * Scrape data from a Printavo workorder URL
   * Based on the URL structure: [subdomain].printavo.com/work_orders/[hash]
   */
  async scrapeWorkorder(workorderUrl) {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // For Render.com
    });
    
    const page = await browser.newPage();
    
    try {
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log(`Navigating to: ${workorderUrl}`);
      await page.goto(workorderUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load (Printavo uses JS rendering)
      await page.waitForTimeout(3000);

      const workorderData = await page.evaluate(() => {
        // Helper function to safely extract text
        const getText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        const getAllText = (selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map(el => el.textContent.trim());
        };

        // Try multiple selectors for each piece of data
        const safeExtract = (selectors) => {
          for (const selector of selectors) {
            const result = getText(selector);
            if (result) return result;
          }
          return '';
        };

        // Extract customer information
        const customerName = safeExtract([
          '.customer-name',
          '.customer-info h3',
          '.customer-info .name',
          '[data-customer-name]',
          'h2.customer',
          '.invoice-header .customer'
        ]);

        const customerEmail = safeExtract([
          '.customer-email',
          '.customer-info .email',
          '[data-customer-email]',
          'a[href^="mailto:"]'
        ]);

        const customerPhone = safeExtract([
          '.customer-phone',
          '.customer-info .phone',
          '[data-customer-phone]',
          '.phone'
        ]);

        // Extract order details
        const orderNumber = safeExtract([
          '.order-number',
          '.invoice-number',
          'h1',
          '.order-id',
          '[data-order-number]'
        ]);

        const dueDate = safeExtract([
          '.due-date',
          '.customer-due-date',
          '[data-due-date]',
          '.dates .due'
        ]);

        // Extract company/shop information
        const company = safeExtract([
          '.customer-company',
          '.company-name',
          '[data-company]',
          '.customer-info .company'
        ]);

        // Extract shipping address
        const shippingAddress = {
          address1: safeExtract(['.shipping-address .address1', '.ship-to .address1', '.shipping .street']),
          address2: safeExtract(['.shipping-address .address2', '.ship-to .address2']),
          city: safeExtract(['.shipping-address .city', '.ship-to .city', '.shipping .city']),
          state: safeExtract(['.shipping-address .state', '.ship-to .state', '.shipping .state']),
          zip: safeExtract(['.shipping-address .zip', '.ship-to .zip', '.shipping .zip']),
          country: safeExtract(['.shipping-address .country', '.ship-to .country']) || 'US'
        };

        // Extract line items - this is the most complex part
        const lineItems = [];
        
        // Try different table/row selectors for line items
        const lineItemSelectors = [
          '.line-items tr',
          '.invoice-line-items tr',
          '.order-items tr',
          'table tbody tr',
          '.line-item-row'
        ];

        let foundItems = false;
        for (const selector of lineItemSelectors) {
          const rows = document.querySelectorAll(selector);
          if (rows.length > 1) { // More than just header
            rows.forEach((row, index) => {
              if (index === 0) return; // Skip header row
              
              const cells = row.querySelectorAll('td');
              if (cells.length >= 3) { // Minimum columns needed
                const item = {
                  description: cells[0]?.textContent?.trim() || '',
                  quantity: this.extractNumber(cells[1]?.textContent || '0'),
                  unitPrice: this.extractPrice(cells[2]?.textContent || '0'),
                  color: '',
                  sizes: {}
                };

                // Try to extract size information from description or separate columns
                const description = item.description.toLowerCase();
                if (description.includes('small') || description.includes(' s ')) item.sizes.s = item.quantity;
                else if (description.includes('medium') || description.includes(' m ')) item.sizes.m = item.quantity;
                else if (description.includes('large') || description.includes(' l ')) item.sizes.l = item.quantity;
                else if (description.includes('xl')) item.sizes.xl = item.quantity;
                else item.sizes.other = item.quantity;

                lineItems.push(item);
                foundItems = true;
              }
            });
            if (foundItems) break;
          }
        }

        // If no table found, try alternative layouts
        if (!foundItems) {
          const itemDivs = document.querySelectorAll('.line-item, .item, .product-line');
          itemDivs.forEach(div => {
            const description = getText(div.querySelector('.description, .item-name, .product-name') || div);
            const quantity = this.extractNumber(getText(div.querySelector('.quantity, .qty')));
            const price = this.extractPrice(getText(div.querySelector('.price, .unit-price, .cost')));
            
            if (description) {
              lineItems.push({
                description,
                quantity: quantity || 1,
                unitPrice: price || 0,
                color: '',
                sizes: { other: quantity || 1 }
              });
            }
          });
        }

        // Extract production notes
        const productionNotes = safeExtract([
          '.production-notes',
          '.notes',
          '.special-instructions',
          '.comments',
          '[data-notes]'
        ]);

        return {
          customerName,
          customerEmail,
          customerPhone,
          company,
          orderNumber,
          dueDate,
          shippingAddress,
          lineItems,
          productionNotes,
          // Include raw HTML for debugging
          rawHTML: document.documentElement.outerHTML.substring(0, 5000) + '...'
        };
      });

      await browser.close();
      
      // Clean up and validate the extracted data
      return this.validateAndCleanData(workorderData);
      
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to scrape workorder: ${error.message}`);
    }
  }

  /**
   * Helper methods that need to be available in the browser context
   */
  static getBrowserHelpers() {
    return `
      window.extractNumber = function(text) {
        const match = text.replace(/[^0-9]/g, '');
        return parseInt(match) || 0;
      };
      
      window.extractPrice = function(text) {
        const match = text.match(/[0-9]+\\.?[0-9]*/);
        return match ? parseFloat(match[0]) : 0;
      };
    `;
  }

  /**
   * Validate and clean extracted data
   */
  validateAndCleanData(data) {
    // Split customer name into first/last
    const nameParts = (data.customerName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Ensure we have at least some basic data
    if (!firstName && !data.company && !data.customerEmail) {
      throw new Error('Could not extract customer information from workorder');
    }

    // Clean up line items
    const cleanLineItems = data.lineItems.filter(item => 
      item.description && item.description.length > 0
    ).map(item => ({
      ...item,
      description: item.description.substring(0, 255), // Printavo field limit
      unitPrice: Math.max(0, item.unitPrice || 0),
      quantity: Math.max(1, item.quantity || 1)
    }));

    if (cleanLineItems.length === 0) {
      throw new Error('Could not extract any line items from workorder');
    }

    return {
      ...data,
      firstName,
      lastName,
      lineItems: cleanLineItems,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Create customer in your Printavo account
   */
  async createCustomer(workorderData) {
    const customerPayload = {
      first_name: workorderData.firstName || '',
      last_name: workorderData.lastName || '',
      company: workorderData.company || '',
      customer_email: workorderData.customerEmail || '',
      phone: workorderData.customerPhone || '',
      shipping_address_attributes: {
        address1: workorderData.shippingAddress.address1 || '',
        address2: workorderData.shippingAddress.address2 || '',
        city: workorderData.shippingAddress.city || '',
        state: workorderData.shippingAddress.state || '',
        zip: workorderData.shippingAddress.zip || '',
        country: workorderData.shippingAddress.country || 'US'
      },
      billing_address_attributes: {
        address1: workorderData.shippingAddress.address1 || '',
        address2: workorderData.shippingAddress.address2 || '',
        city: workorderData.shippingAddress.city || '',
        state: workorderData.shippingAddress.state || '',
        zip: workorderData.shippingAddress.zip || '',
        country: workorderData.shippingAddress.country || 'US'
      }
    };

    try {
      const response = await axios.post(`${this.apiBase}/customers`, customerPayload, {
        params: { email: this.email, token: this.token }
      });
      return response.data;
    } catch (error) {
      console.error('Customer creation error:', error.response?.data || error.message);
      throw new Error(`Failed to create customer: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create order in your Printavo account
   */
  async createOrder(workorderData, customerId, userId, orderstatusId) {
    // Transform line items to Printavo format
    const lineItems = workorderData.lineItems.map(item => {
      const lineItem = {
        style_description: item.description,
        unit_cost: item.unitPrice,
        color: item.color || '',
        taxable: true,
        // Initialize all size fields
        size_xs: 0,
        size_s: 0,
        size_m: 0,
        size_l: 0,
        size_xl: 0,
        size_2xl: 0,
        size_3xl: 0,
        size_other: 0
      };

      // Map sizes from scraped data
      Object.keys(item.sizes).forEach(size => {
        const qty = item.sizes[size];
        switch(size.toLowerCase()) {
          case 'xs': lineItem.size_xs = qty; break;
          case 's': lineItem.size_s = qty; break;
          case 'm': lineItem.size_m = qty; break;
          case 'l': lineItem.size_l = qty; break;
          case 'xl': lineItem.size_xl = qty; break;
          case '2xl': lineItem.size_2xl = qty; break;
          case '3xl': lineItem.size_3xl = qty; break;
          default: lineItem.size_other = qty; break;
        }
      });

      return lineItem;
    });

    const orderPayload = {
      user_id: userId,
      customer_id: customerId,
      orderstatus_id: orderstatusId,
      formatted_due_date: this.formatDate(workorderData.dueDate),
      formatted_customer_due_date: this.formatDate(workorderData.dueDate),
      production_notes: workorderData.productionNotes || `Imported from workorder: ${workorderData.orderNumber}`,
      notes: `Original workorder from Model Citizen Brand Provisions`,
      lineitems_attributes: lineItems
    };

    try {
      const response = await axios.post(`${this.apiBase}/orders`, orderPayload, {
        params: { email: this.email, token: this.token }
      });
      return response.data;
    } catch (error) {
      console.error('Order creation error:', error.response?.data || error.message);
      throw new Error(`Failed to create order: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Main processing function
   */
  async processWorkorder(workorderUrl, userId, orderstatusId) {
    console.log('Starting workorder processing...');
    
    try {
      // Step 1: Scrape the workorder
      console.log('1. Scraping workorder data...');
      const workorderData = await this.scrapeWorkorder(workorderUrl);
      console.log('Extracted data:', JSON.stringify(workorderData, null, 2));

      // Step 2: Create customer
      console.log('2. Creating customer...');
      const customer = await this.createCustomer(workorderData);
      console.log(`Customer created: ${customer.first_name} ${customer.last_name} (ID: ${customer.id})`);

      // Step 3: Create order
      console.log('3. Creating order...');
      const order = await this.createOrder(workorderData, customer.id, userId, orderstatusId);
      console.log(`Order created: #${order.id}`);

      return {
        success: true,
        customer: customer,
        order: order,
        workorderData: workorderData,
        message: `Successfully processed workorder! Customer: ${customer.first_name} ${customer.last_name}, Order: #${order.id}`
      };

    } catch (error) {
      console.error('Processing failed:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * Utility functions
   */
  formatDate(dateString) {
    if (!dateString) {
      // Default to 2 weeks from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      return `${String(futureDate.getMonth() + 1).padStart(2, '0')}/${String(futureDate.getDate()).padStart(2, '0')}/${futureDate.getFullYear()}`;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return this.formatDate(null);
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    } catch {
      return this.formatDate(null);
    }
  }

  extractNumber(text) {
    const match = text.replace(/[^0-9]/g, '');
    return parseInt(match) || 0;
  }

  extractPrice(text) {
    const match = text.match(/[0-9]+\.?[0-9]*/);
    return match ? parseFloat(match[0]) : 0;
  }
}

module.exports = PrintavoWorkorderScraper;
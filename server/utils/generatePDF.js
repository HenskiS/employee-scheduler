const puppeteer = require('puppeteer');

/**
 * Generates a PDF from a URL
 * @param {string} url - URL to navigate to for PDF generation
 * @param {Object} [options] - PDF generation options
 * @returns {Promise<Buffer>} PDF as a buffer
 */
const generatePDF = async (url, options = {}) => {
  let browser = null;
  
  try {
    // Launch a new browser instance
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new', // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport for the page
    await page.setViewport({
      width: options.width || 1100,
      height: options.height || 1400
    });

    // Navigate to the URL
    console.log(`Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: options.waitUntil || 'networkidle2',
      timeout: options.timeout || 30000
    });

    // Wait for content to be fully loaded
    // This can be customized for different applications
    if (options.selector) {
        await page.waitForSelector(options.selector, { 
          visible: true, 
          timeout: options.selectorTimeout || 10000 
        });
    } else {
        // Default waiting time using setTimeout instead of waitForTimeout
        await new Promise(resolve => setTimeout(resolve, options.waitTime || 1000));
    }

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      landscape: options.landscape || false,
      preferCSSPageSize: options.preferCSSPageSize || true
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generates a schedule PDF for a technician
 * @param {string} technicianId - ID of the technician
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {boolean} includeAllEvents - Whether to include 'for all' events
 * @param {Object} [options] - Additional PDF generation options
 * @returns {Promise<Buffer>} PDF as a buffer
 */
const generateSchedulePDF = async (technicianId, startDate, endDate, includeAllEvents = false, options = {}) => {
  const url = `http://localhost:${process.env.PORT}/print?technicianId=${technicianId}&start=${startDate}&end=${endDate}&all=${includeAllEvents}`;
  return await generatePDF(url, options);
};

/**
 * Generates a print preview PDF with filter parameters
 * @param {Object} params - URL parameters object
 * @param {Object} [options] - PDF generation options
 * @returns {Promise<Buffer>} PDF as a buffer
 */
const generatePrintPreviewPDF = async (params, options = {}) => {
  // Build query string from params object
  const queryParams = new URLSearchParams();

  if (params.startDate) queryParams.append('start', params.startDate);
  if (params.endDate) queryParams.append('end', params.endDate);

  const view = params.view || 'agenda';
  queryParams.append('view', view);

  // Handle array parameters (labels, doctors, technicians)
  if (params.labels && params.labels.length > 0) {
    queryParams.append('labels', JSON.stringify(params.labels));
  }

  if (params.doctors && params.doctors.length > 0) {
    queryParams.append('doctors', params.doctors.join(','));
  }

  if (params.technicians && params.technicians.length > 0) {
    queryParams.append('technicians', params.technicians.join(','));
  }

  if (params.tags && params.tags.length > 0) {
    queryParams.append('tags', params.tags.join(','));
  }

  // Add splitByMonth parameter (default to true for backward compatibility)
  const splitByMonth = params.splitByMonth !== undefined ? params.splitByMonth : true;
  queryParams.append('splitByMonth', splitByMonth);

  // Handle display options (compact format)
  if (params.displayOptions) {
    const opts = params.displayOptions;
    const compactOpts = {
      d: opts.showDescription,
      l: opts.showLabel,
      t: opts.showTechnicians,
      on: opts.showOfficeNotes,
      dn: opts.doctorInfo?.showName,
      da: opts.doctorInfo?.showAddress,
      dp: opts.doctorInfo?.showPhone
    };
    queryParams.append('opts', JSON.stringify(compactOpts));
  }

  // Handle custom header
  if (params.customHeader) {
    queryParams.append('header', encodeURIComponent(params.customHeader));
  }

  // Set orientation based on view type
  // Landscape for month/week views, portrait for agenda
  const pdfOptions = {
    ...options,
    landscape: view === 'month' || view === 'week'
  };

  const url = `http://localhost:${process.env.PORT}/print?${queryParams.toString()}`;
  console.log('Generating PDF with URL:', url);
  console.log('PDF params:', JSON.stringify(params, null, 2));
  console.log('PDF orientation:', pdfOptions.landscape ? 'landscape' : 'portrait');
  return await generatePDF(url, pdfOptions);
};

module.exports = {
  generatePDF,
  generateSchedulePDF,
  generatePrintPreviewPDF
};
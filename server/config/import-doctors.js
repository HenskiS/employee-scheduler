const XLSX = require('xlsx');
const { Doctor } = require('../models'); // Adjust path to where your models are exported
const sequelize = require('./database'); // Adjust path to your database config

// Run the script with:
// node import-doctors.js path/to/your/excel/file.xlsx

async function importDoctors(filePath) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows to import`);
    
    // Map Excel headers to database fields
    const mappedData = data.map(row => ({
      customer: row['Customer'] || '',
      practiceName: row['Practice Name'] || '',
      physicalAddress: row['Physical Address'] || '',
      city: row['City'] || '',
      state: row['State'] || '',
      zip: row['Zip'] || '',
      schedulingContact1: row['Scheduling Contact #1'] || '',
      schedulingPhone1: row['Scheduling Phone #1'] || '',
      schedulingEmail1: row['Scheduling Email #1'] || '',
      schedulingContact2: row['Scheduling Contact #2'] || '',
      schedulingPhone2: row['Scheduling Phone #2'] || '',
      schedulingEmail2: row['Scheduling Email #2'] || '',
      billTo: row['Bill to'] || '',
      billingAddress: row['ADDRESS'] || '',
      billingCity: row['CITY'] || '',
      billingState: row['STATE'] || '',
      billingZip: row['ZIP'] || '',
      billingContact: row['Billing Contact'] || '',
      mainPhone: row['Main Phone'] || '',
      fax: row['Fax'] || '',
      notes: row['Notes'] || ''
    }));
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Bulk insert all records
      const result = await Doctor.bulkCreate(mappedData, { transaction });
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`Successfully imported ${result.length} doctors`);
      return result;
    } catch (error) {
      // Rollback in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Example usage (you can also make this a CLI script with command line arguments)
const filePath = process.argv[2] || './doctors.xlsx';

// Run the import
importDoctors(filePath)
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });
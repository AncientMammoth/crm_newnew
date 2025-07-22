// airtable-debug.js - Use to debug Airtable API responses

// Configure these values before running this script
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || 'your-base-id';
const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT || 'your-pat-token';
const PROJECT_ID_TO_TEST = 'reci9GER4mwmnKdX2'; // The project ID you want to test
const DATE_TO_TEST = '2025-05-14'; // YYYY-MM-DD format

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Helper function to normalize dates for comparison
function formatDateForAirtable(dateInput) {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// API request function
async function apiRequest(path, params = "") {
  console.log(`Making API request to: ${path}${params}`);
  const url = `${AIRTABLE_API_URL}/${path}${params}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Airtable API error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Airtable error: ${res.status} ${res.statusText} - ${errorText}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error(`API request failed:`, err);
    throw err;
  }
}

// Debug function to test the API and response handling
export async function debugAirtableUpdates() {
  console.log("=== Testing Airtable Updates API ===");
  console.log("Project ID to test:", PROJECT_ID_TO_TEST);
  console.log("Date to test:", DATE_TO_TEST);

  try {
    // Method 1: Try to use filterByFormula directly
    console.log("\n--- Method 1: Using filterByFormula ---");
    const formula = encodeURIComponent(`AND(FIND("${PROJECT_ID_TO_TEST}", {Project}), {Date}="${DATE_TO_TEST}")`);
    const directFilter = await apiRequest("Updates", `?filterByFormula=${formula}`);
    console.log(`Direct filter found ${directFilter.records.length} records`);
    directFilter.records.forEach(record => {
      console.log("Record ID:", record.id);
      console.log("  Project:", record.fields.Project);
      console.log("  Date:", record.fields.Date);
      console.log("  Type:", record.fields["Update Type"]);
      console.log("  Notes:", record.fields.Notes);
      console.log("---");
    });

    // Method 2: Get all updates for project and filter in memory
    console.log("\n--- Method 2: Get all and filter in memory ---");
    const projectFormula = encodeURIComponent(`FIND("${PROJECT_ID_TO_TEST}", {Project})`);
    const projectUpdates = await apiRequest("Updates", `?filterByFormula=${projectFormula}`);
    
    console.log(`Found ${projectUpdates.records.length} updates for project ${PROJECT_ID_TO_TEST}`);
    
    // Filter by date client-side
    const filteredByDate = projectUpdates.records.filter(record => {
      const recordDate = record.fields.Date;
      const formattedDate = formatDateForAirtable(recordDate);
      
      console.log(`Record ${record.id}: date=${recordDate}, formatted=${formattedDate}, matches=${formattedDate === DATE_TO_TEST}`);
      
      return formattedDate === DATE_TO_TEST;
    });
    
    console.log(`After filtering, found ${filteredByDate.length} records for date ${DATE_TO_TEST}`);
    filteredByDate.forEach(record => {
      console.log("Record ID:", record.id);
      console.log("  Project:", record.fields.Project);
      console.log("  Date:", record.fields.Date);
      console.log("  Type:", record.fields["Update Type"]);
      console.log("  Notes:", record.fields.Notes);
      console.log("---");
    });
    
    return {
      directFilterCount: directFilter.records.length,
      projectUpdatesCount: projectUpdates.records.length,
      filteredByDateCount: filteredByDate.length,
      filteredRecords: filteredByDate
    };
  } catch (error) {
    console.error("Debug test failed:", error);
    return { error: error.message };
  }
}

// To run this debug function from your app:
// import { debugAirtableUpdates } from './airtable-debug';
// debugAirtableUpdates().then(results => console.log("Debug Results:", results));
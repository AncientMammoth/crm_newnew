// airtable-debug.js

// ========== CONFIGURE THESE ==========
const AIRTABLE_BASE_ID = 'appYwdcBUJk04yBqV';
const AIRTABLE_PAT = 'pateITYpySLXHlwGX.182f0bc9006a520827812d4aab29b59a59dd05050da9e0bf1d311d0de8bde018';
const PROJECT_ID_TO_TEST = 'reci9GER4mwmnKdX2';
const DATE_TO_TEST = '2025-05-14'; // YYYY-MM-DD
// =====================================

import fetch from 'node-fetch';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

function formatDateForAirtable(dateInput) {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function apiRequest(path, params = "") {
  const url = `${AIRTABLE_API_URL}/${path}${params}`;
  console.log(`→ Fetching: ${url}`); // 🔍 Log the actual URL being requested

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error: ${res.status} ${res.statusText} - ${err}`);
  }

  return await res.json();
}

async function main() {
  console.log("🔍 Testing Airtable Updates Table...");
  console.log("📁 Project ID to test:", PROJECT_ID_TO_TEST);
  console.log("📅 Date to test:", DATE_TO_TEST);

  const allUpdates = await apiRequest("Updates");
  console.log(`✅ Fetched ${allUpdates.records.length} updates from Airtable.`);

  const matchingUpdates = [];

  for (const rec of allUpdates.records) {
    const { Project: projects, Date: date, Notes } = rec.fields;
    const id = rec.id;
    const isForProject = Array.isArray(projects) && projects.includes(PROJECT_ID_TO_TEST);
    const formattedAirtableDate = formatDateForAirtable(date);
    const isSameDay = formattedAirtableDate === DATE_TO_TEST;

    if (isForProject && isSameDay) {
      matchingUpdates.push(rec);

      console.log(`✅ MATCHED Update ID: ${id}`);
      console.log(`   📅 Date: ${formattedAirtableDate}`);
      console.log(`   📝 Notes: ${Notes}`);
      console.log(`   🔗 Project(s):`, projects);
      console.log(`   📄 All fields:`, rec.fields);
      console.log('----------------------------');
    }
  }

  if (matchingUpdates.length === 0) {
    console.log(`❌ No updates found for project ID "${PROJECT_ID_TO_TEST}" on date "${DATE_TO_TEST}".`);
  } else {
    console.log(`🎯 ${matchingUpdates.length} matching updates found:`);
    matchingUpdates.forEach(u =>
      console.log(`   - ${u.id}: ${u.fields.Notes || '(No notes)'}`)
    );
  }
}

main().catch(err => {
  console.error("🚨 Error during test:", err);
});

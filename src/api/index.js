import axios from 'axios';

// --- Global Data Refresh Mechanism ---
let onDataChangeCallback = null;

/**
 * Registers a callback function that the API module can use to 
 * notify the React UI that its state is stale and needs updating.
 * @param {Function} callback The function to call with the new user data.
 */
export function setOnDataChangeCallback(callback) {
  onDataChangeCallback = callback;
}

/**
 * Fetches the latest user data bundle from the server and passes it
 * to the registered UI callback.
 */
export async function triggerDataRefresh() {
    if (onDataChangeCallback) {
        const secretKey = localStorage.getItem('secretKey');
        if (secretKey) {
            try {
                console.log("Data changed. Refetching all user data...");
                // Re-fetch all user data, just like on login
                const freshUserData = await fetchUserBySecretKey(secretKey);
                // Call the callback to update the UI's state
                onDataChangeCallback(freshUserData);
            } catch (error) {
                console.error("Failed to refetch user data after change:", error);
            }
        }
    }
}

// --- Axios API Client ---
export const api = axios.create({
  baseURL: '/api', // This is correctly set for Vercel rewrites
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Interceptor for Security ---
api.interceptors.request.use(config => {
  const secretKey = localStorage.getItem('secretKey');
  if (secretKey) {
    config.headers['x-secret-key'] = secretKey;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Generic API Request Helper ---
async function apiRequest(path, options = {}) {
  try {
    const response = await api({
      url: path,
      method: options.method || 'GET',
      data: options.body,
    });
    return response.data;
  } catch (err) {
    console.error(`[App API] Error for /api/${path}:`, err);
    // Re-throw the error to be caught by the calling component
    throw err; 
  }
}

// =================================================================
// DATA FORMATTING HELPERS
// =================================================================

const formatAccount = (acc) => ({
    id: acc.id,
    fields: {
        "Account Name": acc.account_name,
        "Account Description": acc.account_description,
        "Account Type": acc.account_type,
        "Projects": acc.projects || [],
        "Account Owner Name": acc.account_owner_name,
    }
});

const formatProject = (proj) => ({
    id: proj.id,
    fields: {
        "Project Name": proj.project_name,
        "Project Status": proj.project_status,
        "Start Date": proj.start_date,
        "End Date": proj.end_date,
        "Account": proj.account_id ? [proj.account_id] : [],
        "Account Name (from Account)": proj.account_name,
        "Project Value": proj.project_value,
        "Project Description": proj.project_description,
        "Updates": proj.updates || [],
        "Project Owner Name": proj.project_owner_name,
    }
});

const formatTask = (task) => ({
    id: task.id,
    fields: {
        "Task Name": task.task_name,
        "Description": task.description,
        "Status": task.status,
        "Due Date": task.due_date,
        "Project": task.project_id ? [task.project_id] : [],
        "Project Name": task.project_name,
        "Assigned To": task.assigned_to_id ? [task.assigned_to_id] : [],
        "Assigned To (Name)": task.assigned_to_name ? [task.assigned_to_name] : undefined,
        "Created By (Name)": task.created_by_name ? [task.created_by_name] : undefined,
        "Updates": task.updates || [],
    }
});

const formatUpdate = (update) => ({
    id: update.id,
    fields: {
        "Notes": update.notes,
        "Date": update.date,
        "Update Type": update.update_type,
        "Project": update.project_id ? [update.project_id] : [],
        "Task": update.task_id ? [update.task_id] : [],
        "Update Owner Name": update.update_owner_name,
        "Project Name": update.project_name,
        "Task Name": update.task_name,
        "Account Name": update.update_account,
    }
});

// =================================================================
// API FUNCTIONS
// =================================================================

export async function fetchUserBySecretKey(secretKey) {
  try {
    const response = await api.post('/auth/login', { secretKey });
    const { user, accounts, projects, tasks_assigned_to, tasks_created_by, updates, delivery_statuses } = response.data;
    
    return {
      id: user.id,
      user_name: user.user_name,
      role: user.role,
      accounts: accounts,
      projects: projects,
      tasks_assigned_to: tasks_assigned_to,
      tasks_created_by: tasks_created_by,
      updates: updates,
      delivery_statuses: delivery_statuses,
    };
  } catch (err) {
    console.error("Authentication error in api/index.js (fetchUserBySecretKey):", err.response?.data || err.message);
    throw err.response?.data?.error || err.message || "Failed to authenticate.";
  }
};

export async function fetchAllUsers() {
    const users = await apiRequest("users");
    return users.map(u => ({ id: u.id, airtable_id: u.airtable_id, fields: { "User Name": u.user_name } }));
}

export async function createRecord(table, fields) {
  const endpoint = table.toLowerCase();
  const result = await apiRequest(endpoint, { method: 'POST', body: fields });
  await triggerDataRefresh();
  return { id: result.id, fields: result };
}

export async function updateRecord(table, id, fields) {
  const endpoint = `${table.toLowerCase()}/${id}`;
  const result = await apiRequest(endpoint, { method: 'PATCH', body: fields });
  await triggerDataRefresh();
  return result;
}

export async function fetchAccountsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const accounts = await apiRequest(`accounts?ids=${ids.join(',')}`);
  return accounts.map(formatAccount);
}

export async function fetchProjectsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const projects = await apiRequest(`projects?ids=${ids.join(',')}`);
  return projects.map(formatProject);
}

export async function fetchTasksByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const tasks = await apiRequest(`tasks?ids=${ids.join(',')}`);
  return tasks.map(formatTask);
}

export async function fetchTasksByCreator(creatorId) {
  if (!creatorId) return [];
  const tasks = await apiRequest(`tasks/by-creator/${creatorId}`);
  return tasks.map(formatTask);
}

export async function fetchUpdatesByIds(ids = []) {
    if (!ids || ids.length === 0) return [];
    const updates = await apiRequest(`updates?ids=${ids.join(',')}`);
    return updates.map(formatUpdate);
}

export async function fetchUpdatesByProjectId(projectId) {
    if (!projectId) return [];
    const updates = await apiRequest(`updates/by-project/${projectId}`); 
    return updates.map(formatUpdate);
}

export const fetchAccountById = async (id) => (await fetchAccountsByIds([id]))[0] || null;
export const fetchProjectById = async (id) => (await fetchProjectsByIds([id]))[0] || null;
export const fetchUpdateById = async (id) => (await fetchUpdatesByIds([id]))[0] || null;
export const fetchTaskById = async (id) => (await fetchTasksByIds([id]))[0] || null;

export const createAccount = (fields) => createRecord("Accounts", fields);
export const createProject = (fields) => createRecord("Projects", fields);
export const createTask = (fields) => createRecord("Tasks", fields);
export const createUpdate = (fields) => createRecord("Updates", fields);

export const updateUser = (userId, fields) => updateRecord("Users", userId, fields);
export const updateTask = (taskId, fields) => updateRecord("Tasks", taskId, fields);

// =================================================================
// ADMIN API FUNCTIONS
// =================================================================

export async function fetchAllUsersForAdmin() {
    const users = await apiRequest("admin/users");
    return users.map(user => ({
        id: user.id,
        fields: {
            "User Name": user.user_name,
            "User Type": user.role,
            "Secret Key": user.airtable_id,
        }
    }));
}

export async function fetchAllProjectsForAdmin(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.ownerId) params.append('ownerId', filters.ownerId);
  if (filters.accountId) params.append('accountId', filters.accountId);
  
  const projects = await apiRequest(`admin/projects?${params.toString()}`);
  return projects.map(formatProject);
}

export async function fetchAllTasksForAdmin() {
  const tasks = await apiRequest("admin/tasks");
  return tasks.map(formatTask);
}

export async function fetchAllAccountsForAdmin(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ownerId) params.append('ownerId', filters.ownerId);

  const accounts = await apiRequest(`admin/accounts?${params.toString()}`);
  return accounts.map(formatAccount);
}

export async function fetchAllUpdatesForAdmin(filters = {}) {
  const params = new URLSearchParams();
  if (filters.ownerId) params.append('ownerId', filters.ownerId);
  if (filters.projectId) params.append('projectId', filters.projectId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const updates = await apiRequest(`admin/updates?${params.toString()}`);
  return updates.map(formatUpdate);
}

export async function fetchAdminUserDetail(userId) {
  const data = await apiRequest(`admin/users/${userId}`);
  const formattedAccounts = data.accounts.map(formatAccount);
  return { user: { ...data.user, user_type: data.user.role }, accounts: formattedAccounts };
}

export async function fetchAdminAccountDetail(accountId) {
  const data = await apiRequest(`admin/accounts/${accountId}`);
  const formattedProjects = data.projects.map(formatProject);
  return { account: formatAccount(data.account), projects: formattedProjects };
}

export async function fetchAdminProjectDetail(projectId) {
  const data = await apiRequest(`admin/projects/${projectId}`);
  return {
      project: formatProject(data.project),
      tasks: data.tasks.map(formatTask),
      updates: data.updates.map(formatUpdate),
  };
}

// =================================================================
// CLIENT-SIDE UTILITY LOGIC (Not direct API calls)
// =================================================================

export function formatDateForAirtable(dateInput) {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function fetchAllUpdates() {
    const updates = await apiRequest("updates");
    return updates.map(formatUpdate);
}

export function processUpdatesByProject(allUpdates, projectIds = []) {
  if (!projectIds || projectIds.length === 0) return {};
  const updatesByProjectId = {};
  projectIds.forEach(pid => { updatesByProjectId[pid] = []; });
  allUpdates.forEach(update => {
    const updateProjectIds = update.fields.Project || [];
    updateProjectIds.forEach(projectId => {
      const matchingId = projectIds.find(p => p === projectId);
      if (matchingId && updatesByProjectId[matchingId]) {
        updatesByProjectId[matchingId].push(update);
      }
    });
  });
  return updatesByProjectId;
}
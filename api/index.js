const express = require("express");
const cors = require("cors");
const db = require("./db"); // Your database connection

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- SQL Query Definitions (FIX: Added these missing query definitions) ---
const accountsQuery = 'SELECT id FROM accounts WHERE account_owner_id = $1';
const projectsQuery = 'SELECT id FROM projects WHERE project_owner_id = $1';
const tasksAssignedQuery = 'SELECT id FROM tasks WHERE assigned_to_id = $1';
const tasksCreatedQuery = 'SELECT id FROM tasks WHERE created_by_id = $1';
const updatesQuery = 'SELECT id FROM updates WHERE update_owner_id = $1';
const deliveryStatusQuery = 'SELECT id FROM all_projects WHERE created_by_user_id = $1';


// --- Helper Functions ---
// Enhanced sendError to include path for better debugging in logs
const sendError = (res, message, err, path = 'N/A') => {
  console.error(`[ERROR] Path: ${path} - ${message}`, err);
  // Ensure a JSON response is always sent, even for internal errors
  if (!res.headersSent) {
    res.status(500).json({ error: message, details: err.message || 'Unknown error' });
  }
};

// --- Authentication Middleware (Generic) ---
// This middleware now explicitly checks the user's role against requiredRole.
const authMiddleware = (requiredRole) => async (req, res, next) => {
  const secretKey = req.headers['x-secret-key'];
  if (!secretKey) {
    console.log(`[AUTH] Path: ${req.path} - Unauthorized: No secret key provided.`);
    return res.status(401).json({ error: 'Unauthorized: No secret key provided.' });
  }
  try {
    const userQuery = 'SELECT id, role FROM users WHERE airtable_id = $1'; // Fetch user ID too
    const { rows } = await db.query(userQuery, [secretKey]);
    
    if (rows.length > 0 && rows[0].role === requiredRole) {
      req.user = { id: rows[0].id, role: rows[0].role }; // Attach user info to request
      console.log(`[AUTH] Path: ${req.path} - User ID: ${req.user.id}, Role: '${req.user.role}' authorized for '${requiredRole}'.`);
      next();
    } else {
      console.log(`[AUTH] Path: ${req.path} - Forbidden: User role '${rows.length > 0 ? rows[0].role : 'N/A'}' does not match required role '${requiredRole}'.`);
      res.status(403).json({ error: `Forbidden: ${requiredRole} access required.` });
    }
  } catch (error) {
    sendError(res, 'Authentication error', error, req.path);
  }
};

const adminAuth = authMiddleware('admin');
const salesExecutiveAuth = authMiddleware('sales_executive');
const deliveryHeadAuth = authMiddleware('delivery_head');


// =================================================================
// --- LOGIN ENDPOINT ---
// =================================================================
app.post("/api/auth/login", async (req, res) => {
    const { secretKey } = req.body;
    console.log(`[LOGIN] Attempting login for secretKey: ${secretKey ? secretKey.substring(0, 5) + '...' : 'N/A'}`);
    
    if (!secretKey) {
        console.log('[LOGIN] Secret key is missing from request body.');
        return res.status(400).json({ error: "Secret key is required." });
    }

    try {
        let userResult = await db.query('SELECT * FROM users WHERE airtable_id = $1', [secretKey]);
        let user;

        // If user not found, create a new sales_executive user
        if (userResult.rows.length === 0) {
            console.log(`[LOGIN] User with secret key ${secretKey.substring(0, 5) + '...'} not found. Creating new user as 'sales_executive'.`);
            const newUserName = `User_${Math.random().toString(36).substring(7)}`; // Generate a random name
            const defaultRole = 'sales_executive'; // Default role for new users
            const insertResult = await db.query(
                'INSERT INTO users (airtable_id, user_name, role) VALUES ($1, $2, $3) RETURNING *',
                [secretKey, newUserName, defaultRole]
            );
            user = insertResult.rows[0];
            console.log(`[LOGIN] New user created: ID: ${user.id}, Name: ${user.user_name}, Role: ${user.role}`);
        } else {
            user = userResult.rows[0];
            console.log(`[LOGIN] User found: ID: ${user.id}, Name: ${user.user_name}, Role: ${user.role}`);
            // Explicitly ensure existing user has a role, default to sales_executive if null/empty/undefined
            if (!user.role || (user.role !== 'admin' && user.role !== 'delivery_head')) {
                console.log(`[LOGIN] User ${user.user_name} has role '${user.role}'. Defaulting to 'sales_executive' for session if not admin/delivery_head.`);
                // We don't need to update the DB here unless we want to persist this default.
                // For session-based defaulting, just set it on the user object.
                user.role = 'sales_executive'; 
            }
        }

        // Fetch associated data for the user
        // Added logs for each data fetch
        const accountsResult = await db.query(accountsQuery, [user.id]);
        console.log(`[LOGIN] Fetched ${accountsResult.rows.length} accounts for user ID ${user.id}.`);
        const projectsResult = await db.query(projectsQuery, [user.id]);
        console.log(`[LOGIN] Fetched ${projectsResult.rows.length} projects for user ID ${user.id}.`);
        const tasksAssignedResult = await db.query(tasksAssignedQuery, [user.id]);
        console.log(`[LOGIN] Fetched ${tasksAssignedResult.rows.length} assigned tasks for user ID ${user.id}.`);
        const tasksCreatedResult = await db.query(tasksCreatedQuery, [user.id]);
        console.log(`[LOGIN] Fetched ${tasksCreatedResult.rows.length} created tasks for user ID ${user.id}.`);
        const updatesResult = await db.query(updatesQuery, [user.id]);
        console.log(`[LOGIN] Fetched ${updatesResult.rows.length} updates for user ID ${user.id}.`);
        const deliveryStatusResult = await db.query(deliveryStatusQuery, [user.id]);
        console.log(`[LOGIN] Fetched ${deliveryStatusResult.rows.length} delivery statuses for user ID ${user.id}.`);

        res.status(200).json({
            user: {
                id: user.id,
                airtable_id: user.airtable_id,
                user_name: user.user_name,
                role: user.role, // This will now always be 'admin', 'delivery_head', or 'sales_executive'
            },
            accounts: accountsResult.rows,
            projects: projectsResult.rows,
            tasks_assigned_to: tasksAssignedResult.rows,
            tasks_created_by: tasksCreatedResult.rows,
            updates: updatesResult.rows,
            delivery_statuses: deliveryStatusResult.rows,
        });
        console.log(`[LOGIN] User ${user.user_name} (ID: ${user.id}) logged in successfully with role: ${user.role}.`);

    } catch (err) {
        sendError(res, "Login process failed.", err, req.path);
    }
});


// =================================================================
// --- ADMIN ROUTES (Protected) ---
// =================================================================
app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT id, user_name, role, airtable_id FROM users');
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${result.rows.length} admin users.`);
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin users.", error, req.path);
    }
});

app.get("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userQuery = 'SELECT id, user_name, role, airtable_id FROM users WHERE id = $1';
        const accountsQuery = 'SELECT * FROM accounts WHERE account_owner_id = $1 ORDER BY created_at DESC';
        const userResult = await db.query(userQuery, [id]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found." });
        console.log(`[ADMIN] Path: ${req.path} - Fetched details for user ID ${id}.`);
        const accountsResult = await db.query(accountsQuery, [id]);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${accountsResult.rows.length} accounts for user ID ${id}.`);
        res.status(200).json({ user: userResult.rows[0], accounts: accountsResult.rows });
    } catch (error) {
        sendError(res, "Failed to fetch user details.", error, req.path);
    }
});

app.get("/api/admin/accounts", adminAuth, async (req, res) => {
    try {
        const { ownerId } = req.query;
        let query = `
            SELECT a.*, u.user_name as account_owner_name 
            FROM accounts a
            LEFT JOIN users u ON a.account_owner_id = u.id
        `;
        const queryParams = [];
        if (ownerId) {
            queryParams.push(ownerId);
            query += ` WHERE a.account_owner_id = $1`;
        }
        query += " ORDER BY a.created_at DESC";
        const result = await db.query(query, queryParams);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${result.rows.length} admin accounts.`);
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin accounts.", error, req.path);
    }
});

app.get("/api/admin/accounts/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const accountQuery = 'SELECT a.*, u.user_name as account_owner_name FROM accounts a LEFT JOIN users u ON a.account_owner_id = u.id WHERE a.id = $1';
        const projectsQuery = 'SELECT p.*, u.user_name as project_owner_name FROM projects p LEFT JOIN users u ON p.project_owner_id = u.id WHERE p.account_id = $1 ORDER BY p.created_at DESC';
        const accountResult = await db.query(accountQuery, [id]);
        if (accountResult.rows.length === 0) return res.status(404).json({ error: "Account not found." });
        console.log(`[ADMIN] Path: ${req.path} - Fetched details for account ID ${id}.`);
        const projectsResult = await db.query(projectsQuery, [id]);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${projectsResult.rows.length} projects for account ID ${id}.`);
        res.status(200).json({ account: accountResult.rows[0], projects: projectsResult.rows });
    } catch (error) {
        sendError(res, "Failed to fetch account details.", error, req.path);
    }
});

app.get("/api/admin/projects", adminAuth, async (req, res) => {
    try {
        const { search, status, ownerId, accountId } = req.query;
        let query = `
            SELECT p.*, a.account_name, u.user_name as project_owner_name
            FROM projects p
            LEFT JOIN accounts a ON p.account_id = a.id
            LEFT JOIN users u ON p.project_owner_id = u.id
        `;
        const queryParams = [];
        const whereClauses = [];

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`p.project_name ILIKE $${queryParams.length}`);
        }
        if (status) {
            queryParams.push(status);
            whereClauses.push(`p.project_status = $${queryParams.length}`);
        }
        if (ownerId) {
            queryParams.push(ownerId);
            whereClauses.push(`p.project_owner_id = $${queryParams.length}`);
        }
        if (accountId) {
            queryParams.push(accountId);
            whereClauses.push(`p.account_id = $${queryParams.length}`);
        }
        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }
        query += " ORDER BY p.created_at DESC";

        const result = await db.query(query, queryParams);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${result.rows.length} admin projects.`);
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin projects.", error, req.path);
    }
});

app.get("/api/admin/projects/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const projectQuery = `SELECT p.*, a.account_name, u.user_name as project_owner_name FROM projects p LEFT JOIN accounts a ON p.account_id = a.id LEFT JOIN users u ON p.project_owner_id = u.id WHERE p.id = $1`;
        const tasksQuery = `SELECT t.*, u.user_name as assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to_id = u.id WHERE t.project_id = $1 ORDER BY t.created_at DESC`;
        const updatesQuery = `SELECT u.*, owner.user_name as update_owner_name FROM updates u LEFT JOIN users owner ON u.update_owner_id = owner.id WHERE u.project_id = $1 ORDER BY u.date DESC, u.created_at DESC`;

        const projectResult = await db.query(projectQuery, [id]);
        if (projectResult.rows.length === 0) return res.status(404).json({ error: "Project not found." });
        console.log(`[ADMIN] Path: ${req.path} - Fetched details for project ID ${id}.`);

        const [tasksResult, updatesResult] = await Promise.all([
            db.query(tasksQuery, [id]),
            db.query(updatesQuery, [id])
        ]);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${tasksResult.rows.length} tasks and ${updatesResult.rows.length} updates for project ID ${id}.`);

        res.status(200).json({ project: projectResult.rows[0], tasks: tasksResult.rows, updates: updatesResult.rows });
    }
    catch (error) {
        sendError(res, "Failed to fetch project details.", error, req.path);
    }
});

// --- UPDATED ADMIN TASKS ROUTE ---
app.get("/api/admin/tasks", adminAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                t.*,
                p.project_name,
                u_assigned.user_name as assigned_to_name,
                u_creator.user_name as created_by_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u_assigned ON t.assigned_to_id = u_assigned.id
            LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
            ORDER BY t.created_at DESC
        `;
        const result = await db.query(query);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${result.rows.length} admin tasks.`);
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin tasks.", error, req.path);
    }
});

app.get("/api/admin/updates", adminAuth, async (req, res) => {
    try {
        const { ownerId, projectId, startDate, endDate } = req.query;
        let query = `
            SELECT u.*, p.project_name, owner.user_name as update_owner_name
            FROM updates u
            LEFT JOIN projects p ON u.project_id = p.id
            LEFT JOIN users owner ON u.update_owner_id = owner.id
        `;
        const queryParams = [];
        const whereClauses = [];

        if (ownerId) {
            queryParams.push(ownerId);
            whereClauses.push(`u.update_owner_id = $${queryParams.length}`);
        }
        if (projectId) {
            queryParams.push(projectId);
            whereClauses.push(`u.project_id = $${queryParams.length}`);
        }
        if (startDate) {
            queryParams.push(startDate);
            whereClauses.push(`u.date >= $${queryParams.length}`);
        }
        if (endDate) {
            queryParams.push(endDate);
            whereClauses.push(`u.date <= $${queryParams.length}`);
        }
        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }
        query += " ORDER BY u.date DESC, u.created_at DESC";
        
        const result = await db.query(query, queryParams);
        console.log(`[ADMIN] Path: ${req.path} - Fetched ${result.rows.length} admin updates.`);
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin updates.", error, req.path);
    }
});


// =================================================================
// --- REGULAR USER (SALES EXECUTIVE) ENDPOINTS ---
// =================================================================

app.get("/api/users", async (req, res) => {
    try {
        const { rows } = await db.query("SELECT id, airtable_id, user_name FROM users ORDER BY user_name;");
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} users.`);
        res.json(rows);
    } catch (err) {
        sendError(res, "Failed to fetch all users.", err, req.path);
    }
});

app.patch("/api/users/:id", async (req, res) => {
    res.status(200).json({ message: "User update acknowledged." });
});

app.get("/api/accounts", async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "No IDs provided." });
        const idArray = ids.split(',').map(Number);
        const { rows } = await db.query(
            `SELECT a.*, COALESCE(p.projects, '[]') as projects
             FROM accounts a
             LEFT JOIN (
                 SELECT account_id, json_agg(p.id) as projects
                 FROM projects p
                 GROUP BY account_id
             ) p ON p.account_id = a.id
             WHERE a.id = ANY($1::integer[])`, [idArray]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} accounts for IDs: ${ids}.`);
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch accounts', err, req.path);
    }
});

app.get("/api/projects", async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "No IDs provided." });
        const idArray = ids.split(',').map(Number);
        const { rows } = await db.query(
            `SELECT p.*, a.account_name, COALESCE(upd.updates, '[]'::json) as updates
             FROM projects p
             LEFT JOIN accounts a ON p.account_id = a.id
             LEFT JOIN (
                 SELECT project_id, json_agg(upd.id ORDER BY date DESC, created_at DESC) as updates
                 FROM updates upd
                 GROUP BY project_id
             ) upd ON upd.project_id = p.id
             WHERE p.id = ANY($1::integer[])`, [idArray]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} projects for IDs: ${ids}.`);
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch projects', err, req.path);
    }
});

app.get("/api/tasks", async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "No IDs provided." });
        
        const idArray = ids.split(',').map(Number);
        if (idArray.some(isNaN)) {
            return res.status(400).json({ error: "Invalid ID format provided."});
        }

        const query = `
            SELECT 
                t.*, 
                p.project_name, 
                p.id as project_id, 
                u_assigned.user_name as assigned_to_name,
                u_creator.user_name as created_by_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u_assigned ON t.assigned_to_id = u_assigned.id
            LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
            WHERE t.id = ANY($1::integer[])
        `;
        
        const { rows } = await db.query(query, [idArray]);
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} tasks for IDs: ${ids}.`);
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch tasks', err, req.path);
    }
});

app.get("/api/tasks/by-creator/:creatorId", async (req, res) => {
    try {
        const { creatorId } = req.params;
        if (!creatorId) {
            return res.status(400).json({ error: "Creator ID is required." });
        }
        
        const userResult = await db.query('SELECT id FROM users WHERE airtable_id = $1', [creatorId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Creator not found." });
        }
        const internalCreatorId = userResult.rows[0].id;

        const { rows } = await db.query(
            `SELECT t.*, 
                    p.project_name, 
                    p.id as project_id, 
                    u_assigned.user_name as assigned_to_name,
                    u_creator.user_name as created_by_name
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             LEFT JOIN users u_assigned ON t.assigned_to_id = u_assigned.id
             LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
             WHERE t.created_by_id = $1
             ORDER BY t.created_at DESC`, 
            [internalCreatorId]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} tasks by creator ID: ${creatorId}.`);
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch tasks by creator', err, req.path);
    }
});


app.get("/api/updates", async (req, res) => {
    try {
        const { ids } = req.query;
        let query = `
            SELECT u.*, owner.user_name as update_owner_name, p.project_name, p.id as project_id, t.task_name, t.id as task_id, a.account_name as update_account
            FROM updates u
            LEFT JOIN users owner ON u.update_owner_id = owner.id
            LEFT JOIN projects p ON u.project_id = p.id
            LEFT JOIN tasks t ON u.task_id = t.id
            LEFT JOIN accounts a ON p.account_id = a.id
        `;
        const queryParams = [];
        if (ids) {
            query += ` WHERE u.id = ANY($1::integer[])`;
            queryParams.push(ids.split(',').map(Number));
        }
        query += ` ORDER BY u.date DESC, u.created_at DESC`;
        const { rows } = await db.query(query, queryParams);
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} updates for IDs: ${ids}.`);
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch updates', err, req.path);
    }
});

app.post("/api/accounts", async (req, res) => {
    const { "Account Name": account_name, "Account Type": account_type, "Account Description": account_description, "Account Owner": owner_airtable_id_arr } = req.body;
    try {
        const ownerRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [owner_airtable_id_arr[0]]);
        const owner_id = ownerRes.rows[0]?.id;
        if (!owner_id) return res.status(400).json({ error: "Invalid account owner ID" });
        const { rows } = await db.query(
            `INSERT INTO accounts (account_name, account_type, account_description, account_owner_id) VALUES ($1, $2, $3, $4) RETURNING *`,
            [account_name, account_type, account_description, owner_id]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Created account ID: ${rows[0].id}.`);
        res.status(201).json(rows[0]);
    } catch (err) { sendError(res, 'Failed to create account.', err, req.path); }
});

app.post("/api/projects", async (req, res) => {
    const { "Project Name": name, "Project Status": status, "Start Date": start_date, "End Date": end_date, "Account": account_id_arr, "Project Value": value, "Project Description": description, "Project Owner": owner_airtable_id_arr } = req.body;
    try {
        const account_id = account_id_arr[0];
        const ownerRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [owner_airtable_id_arr[0]]);
        const owner_id = ownerRes.rows[0]?.id;
        if (!account_id || !owner_id) return res.status(400).json({ error: "Invalid account or owner ID" });
        const { rows } = await db.query(
            `INSERT INTO projects (project_name, project_status, start_date, end_date, account_id, project_value, project_description, project_owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, status, start_date, end_date, account_id, value || null, description, owner_id]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Created project ID: ${rows[0].id}.`);
        res.status(201).json(rows[0]);
    } catch (err) { sendError(res, 'Failed to create project.', err, req.path); }
});

app.post("/api/tasks", async (req, res) => {
    const { "Task Name": name, "Project": project_id, "Assigned To": assigned_to_airtable_id, "Due Date": due_date, "Status": status, "Description": description, "Created By": created_by_airtable_id } = req.body;
    try {
        const assignedToRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [assigned_to_airtable_id]);
        const createdByRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [created_by_airtable_id]);
        const assigned_to_id = assignedToRes.rows[0]?.id;
        const created_by_id = createdByRes.rows[0]?.id;
        if (!project_id || !assigned_to_id || !created_by_id) {
            return res.status(400).json({ error: "Invalid project, assigned to, or created by ID" });
        }
        const { rows } = await db.query(
            `INSERT INTO tasks (task_name, project_id, assigned_to_id, due_date, status, description, created_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, project_id, assigned_to_id, due_date, status, description, created_by_id]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Created task ID: ${rows[0].id}.`);
        res.status(201).json(rows[0]);
    } catch (err) { 
        sendError(res, 'Failed to create task.', err, req.path); 
    }
});

app.post("/api/updates", async (req, res) => {
    const { "Notes": notes, "Date": date, "Update Type": update_type, "Project": project_id, "Task": task_id, "Update Owner": owner_airtable_id } = req.body;
    try {
        const ownerRes = await db.query("SELECT id, user_name FROM users WHERE airtable_id = $1", [owner_airtable_id]);
        const owner_id = ownerRes.rows[0]?.id;
        const update_owner_name = ownerRes.rows[0]?.user_name;
        const projectInfoRes = await db.query(
            `SELECT p.project_name, a.account_name FROM projects p JOIN accounts a ON p.account_id = a.id WHERE p.id = $1`, [project_id]
        );
        const project_name = projectInfoRes.rows[0]?.project_name;
        const update_account = projectInfoRes.rows[0]?.account_name;
        if (!project_id || !owner_id || !project_name || !update_owner_name || !update_account) {
            return res.status(400).json({ error: "Invalid IDs, or associated names/account could not be found." });
        }
        const { rows } = await db.query(
            `INSERT INTO updates (notes, date, update_type, project_id, task_id, update_owner_id, project_name, update_owner_name, update_account) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [notes, date, update_type, project_id, task_id || null, owner_id, project_name, update_owner_name, update_account]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Created update ID: ${rows[0].id}.`);
        res.status(201).json(rows[0]);
    } catch (err) {
        sendError(res, 'Failed to create update.', err, req.path);
    }
});

app.patch("/api/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ error: "No fields provided to update." });
        }
        const setClauses = Object.keys(fields).map((key, index) => {
            const dbColumn = key.replace(/\s+/g, '_').toLowerCase();
            return `"${dbColumn}" = $${index + 1}`;
        }).join(", ");
        const values = Object.values(fields);
        const { rows } = await db.query(
            `UPDATE projects SET ${setClauses} WHERE id = $${values.length + 1} RETURNING *`,
            [...values, id]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Updated project ID: ${rows[0].id}.`);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Project not found or no update was made." });
        }
        res.json(rows[0]);
    } catch (err) {
        sendError(res, "Failed to update project.", err, req.path);
    }
});

app.patch("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        const fieldToUpdate = Object.keys(fields)[0];
        const value = fields[fieldToUpdate];
        const dbColumn = fieldToUpdate.toLowerCase();
        const { rows } = await db.query(
            `UPDATE tasks SET ${dbColumn} = $1 WHERE id = $2 RETURNING *`,
            [value, id]
        );
        console.log(`[SALES_EXEC] Path: ${req.path} - Updated task ID: ${rows[0].id}.`);
        res.json(rows[0]);
    } catch (err) { sendError(res, "Failed to update task.", err, req.path); }
});

// =================================================================
// --- DELIVERY STATUS ENDPOINTS (SALES EXECUTIVE) ---
// =================================================================

// Helper to convert 'Yes'/'No'/'N/A' to boolean/null
const convertToBooleanOrNull = (value) => {
  if (value === 'Yes') return true;
  if (value === 'No') return false;
  return null; // For 'N/A' or any other value
};

app.post("/api/delivery-status", salesExecutiveAuth, async (req, res) => {
    const {
        crm_project_id,
        project_type,
        service_type,
        number_of_files,
        deadline,
        output_format,
        open_project_files_provided,
        total_duration_minutes,
        language_pair,
        target_language_dialect,
        voice_match_needed,
        lip_match_needed,
        sound_balancing_needed,
        premix_files_shared,
        me_files_shared,
        high_res_video_shared,
        caption_type,
        on_screen_editing_required,
        deliverable,
        voice_over_gender,
        source_word_count,
        source_languages,
        target_languages,
        formatting_required
    } = req.body;

    try {
        // Get user ID from secretKey in headers
        const secretKey = req.headers['x-secret-key'];
        const userRes = await db.query("SELECT id, user_name FROM users WHERE airtable_id = $1", [secretKey]);
        const created_by_user_id = userRes.rows[0]?.id;
        const sales_executive_name = userRes.rows[0]?.user_name;

        if (!created_by_user_id) {
            return res.status(400).json({ error: "User ID not found for the provided secret key." });
        }

        // Fetch project name from CRM projects table
        const projectRes = await db.query("SELECT project_name FROM projects WHERE id = $1", [crm_project_id]);
        const project_name = projectRes.rows[0]?.project_name;

        if (!project_name) {
            return res.status(400).json({ error: "CRM Project not found." });
        }

        const query = `
            INSERT INTO all_projects (
                crm_project_id, created_by_user_id, project_name, sales_executive_name,
                project_type, service_type, number_of_files, deadline, output_format,
                open_project_files_provided, total_duration_minutes, language_pair,
                target_language_dialect, voice_match_needed, lip_match_needed,
                sound_balancing_needed, premix_files_shared, me_files_shared,
                high_res_video_shared, caption_type, on_screen_editing_required,
                deliverable, voice_over_gender, source_word_count, source_languages,
                target_languages, formatting_required
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
            RETURNING *;
        `;

        const values = [
            crm_project_id,
            created_by_user_id,
            project_name,
            sales_executive_name,
            project_type,
            service_type,
            number_of_files || null,
            deadline || null,
            output_format || null,
            convertToBooleanOrNull(open_project_files_provided),
            project_type === 'QVO' ? total_duration_minutes || null : null,
            project_type === 'QVO' ? language_pair || null : null,
            project_type === 'QVO' ? target_language_dialect || null : null,
            project_type === 'QVO' ? convertToBooleanOrNull(voice_match_needed) : null,
            project_type === 'QVO' ? convertToBooleanOrNull(lip_match_needed) : null,
            project_type === 'QVO' ? convertToBooleanOrNull(sound_balancing_needed) : null,
            project_type === 'QVO' ? convertToBooleanOrNull(premix_files_shared) : null,
            project_type === 'QVO' ? convertToBooleanOrNull(me_files_shared) : null,
            project_type === 'QVO' ? convertToBooleanOrNull(high_res_video_shared) : null,
            project_type === 'QVO' ? caption_type || null : null,
            project_type === 'QVO' ? convertToBooleanOrNull(on_screen_editing_required) : null,
            project_type === 'QVO' ? deliverable || null : null,
            project_type === 'QVO' ? voice_over_gender || null : null,
            project_type === 'DT' ? source_word_count || null : null,
            project_type === 'DT' ? source_languages || null : null,
            project_type === 'DT' ? target_languages || null : null,
            project_type === 'DT' ? convertToBooleanOrNull(formatting_required) : null
        ];

        const { rows } = await db.query(query, values);
        console.log(`[SALES_EXEC] Path: ${req.path} - Created delivery status ID: ${rows[0].id}.`);
        res.status(201).json(rows[0]);
    } catch (err) {
        sendError(res, 'Failed to create project delivery status.', err, req.path);
    }
});

app.put("/api/delivery-status/:id", salesExecutiveAuth, async (req, res) => {
    const { id } = req.params;
    const fields = req.body;

    try {
        const secretKey = req.headers['x-secret-key'];
        const userRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [secretKey]);
        const created_by_user_id = userRes.rows[0]?.id;

        if (!created_by_user_id) {
            return res.status(400).json({ error: "User ID not found for the provided secret key." });
        }

        // Ensure the user is only updating their own delivery status
        const checkOwnershipQuery = 'SELECT created_by_user_id FROM all_projects WHERE id = $1';
        const ownershipResult = await db.query(checkOwnershipQuery, [id]);

        if (ownershipResult.rows.length === 0) {
            return res.status(404).json({ error: "Delivery status not found." });
        }
        if (ownershipResult.rows[0].created_by_user_id !== created_by_user_id) {
            return res.status(403).json({ error: "Forbidden: You can only update your own delivery statuses." });
        }

        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        for (const key in fields) {
            if (fields.hasOwnProperty(key)) {
                let value = fields[key];
                // Handle boolean conversions
                if (['open_project_files_provided', 'voice_match_needed', 'lip_match_needed', 
                     'sound_balancing_needed', 'premix_files_shared', 'me_files_shared', 
                     'high_res_video_shared', 'on_screen_editing_required', 'formatting_required'].includes(key)) {
                    value = convertToBooleanOrNull(value);
                }
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: "No fields provided for update." });
        }

        values.push(id); // Add id for WHERE clause
        const query = `UPDATE all_projects SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;

        const { rows } = await db.query(query, values);
        console.log(`[SALES_EXEC] Path: ${req.path} - Updated delivery status ID: ${rows[0].id}.`);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Delivery status not found or no update was made." });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        sendError(res, 'Failed to update project delivery status.', err, req.path);
    }
});

app.get("/api/delivery-status/my", salesExecutiveAuth, async (req, res) => {
    try {
        const secretKey = req.headers['x-secret-key'];
        const userRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [secretKey]);
        const created_by_user_id = userRes.rows[0]?.id;

        if (!created_by_user_id) {
            return res.status(400).json({ error: "User ID not found for the provided secret key." });
        }

        const { ids } = req.query; // Optional: allow filtering by specific IDs
        let query = `
            SELECT ap.*, p.project_name, u.user_name as sales_executive_name
            FROM all_projects ap
            LEFT JOIN projects p ON ap.crm_project_id = p.id
            LEFT JOIN users u ON ap.created_by_user_id = u.id
            WHERE ap.created_by_user_id = $1
        `;
        const queryParams = [created_by_user_id];

        if (ids) {
            const idArray = ids.split(',').map(Number);
            query += ` AND ap.id = ANY($2::integer[])`;
            queryParams.push(idArray);
        }
        query += ` ORDER BY ap.created_at DESC;`;

        const { rows } = await db.query(query, queryParams);
        console.log(`[SALES_EXEC] Path: ${req.path} - Fetched ${rows.length} user-specific delivery statuses.`);
        res.status(200).json(rows);
    } catch (error) {
        sendError(res, "Failed to fetch user's project delivery statuses.", error, req.path);
    }
});

// =================================================================
// --- DELIVERY HEAD ENDPOINTS ---
// =================================================================

app.get("/api/delivery-head/delivery-status", deliveryHeadAuth, async (req, res) => {
    try {
        const { search, projectType, serviceType } = req.query;
        let query = `
            SELECT ap.*, p.project_name, u.user_name as sales_executive_name
            FROM all_projects ap
            LEFT JOIN projects p ON ap.crm_project_id = p.id
            LEFT JOIN users u ON ap.created_by_user_id = u.id
        `;
        const queryParams = [];
        const whereClauses = [];

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(p.project_name ILIKE $${queryParams.length} OR ap.service_type ILIKE $${queryParams.length} OR u.user_name ILIKE $${queryParams.length})`);
        }
        if (projectType) {
            queryParams.push(projectType);
            whereClauses.push(`ap.project_type = $${queryParams.length}`);
        }
        if (serviceType) {
            queryParams.push(serviceType);
            whereClauses.push(`ap.service_type ILIKE $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            query += " WHERE " + whereClauses.join(" AND ");
        }
        query += " ORDER BY ap.created_at DESC;";

        const { rows } = await db.query(query, queryParams);
        console.log(`[DELIVERY_HEAD] Path: ${req.path} - Fetched ${rows.length} all delivery statuses.`);
        res.status(200).json(rows);
    } catch (error) {
        sendError(res, "Failed to fetch all project delivery statuses for delivery head.", error, req.path);
    }
});

app.get("/api/delivery-head/delivery-status/:id", deliveryHeadAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT ap.*, p.project_name, u.user_name as sales_executive_name
            FROM all_projects ap
            LEFT JOIN projects p ON ap.crm_project_id = p.id
            LEFT JOIN users u ON ap.created_by_user_id = u.id
            WHERE ap.id = $1;
        `;
        const { rows } = await db.query(query, [id]);
        console.log(`[DELIVERY_HEAD] Path: ${req.path} - Fetched details for delivery status ID: ${id}.`);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Project delivery status not found." });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        sendError(res, "Failed to fetch project delivery status details for delivery head.", error, req.path);
    }
});


// Export the app for Vercel
module.exports = app;

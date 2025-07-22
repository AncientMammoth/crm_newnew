const express = require("express");
const cors = require("cors");
const db = require("./db"); // Your database connection

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Helper Functions ---
const sendError = (res, message, err) => {
  console.error(message, err);
  res.status(500).json({ error: message, details: err.message });
};

// --- Admin Authentication Middleware ---
const adminAuth = async (req, res, next) => {
  const secretKey = req.headers['x-secret-key'];
  if (!secretKey) {
    return res.status(401).json({ error: 'Unauthorized: No secret key provided.' });
  }
  try {
    const userQuery = 'SELECT user_type FROM users WHERE airtable_id = $1';
    const { rows } = await db.query(userQuery, [secretKey]);
    if (rows.length > 0 && rows[0].user_type === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
  } catch (error) {
    sendError(res, 'Admin auth error', error);
  }
};


// =================================================================
// --- LOGIN ENDPOINT ---
// =================================================================
app.post("/api/auth/login", async (req, res) => {
    const { secretKey } = req.body;
    if (!secretKey) {
        return res.status(400).json({ error: "Secret key is required." });
    }
    try {
        const userQuery = 'SELECT * FROM users WHERE airtable_id = $1';
        const userResult = await db.query(userQuery, [secretKey]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        const user = userResult.rows[0];

        const accountsQuery = 'SELECT id FROM accounts WHERE account_owner_id = $1';
        const projectsQuery = 'SELECT id FROM projects WHERE project_owner_id = $1';
        const tasksAssignedQuery = 'SELECT id FROM tasks WHERE assigned_to_id = $1';
        const tasksCreatedQuery = 'SELECT id FROM tasks WHERE created_by_id = $1';
        const updatesQuery = 'SELECT id FROM updates WHERE update_owner_id = $1';

        const [
            accountsResult,
            projectsResult,
            tasksAssignedResult,
            tasksCreatedResult,
            updatesResult
        ] = await Promise.all([
            db.query(accountsQuery, [user.id]),
            db.query(projectsQuery, [user.id]),
            db.query(tasksAssignedQuery, [user.id]),
            db.query(tasksCreatedQuery, [user.id]),
            db.query(updatesQuery, [user.id])
        ]);

        res.status(200).json({
            user: {
                airtable_id: user.airtable_id,
                user_name: user.user_name,
                user_type: user.user_type,
            },
            accounts: accountsResult.rows,
            projects: projectsResult.rows,
            tasks_assigned_to: tasksAssignedResult.rows,
            tasks_created_by: tasksCreatedResult.rows,
            updates: updatesResult.rows,
        });

    } catch (err) {
        sendError(res, "Login failed.", err);
    }
});


// =================================================================
// --- ADMIN ROUTES (Protected) ---
// =================================================================
app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT id, user_name, user_type, airtable_id FROM users');
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin users.", error);
    }
});

app.get("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userQuery = 'SELECT id, user_name, user_type, airtable_id FROM users WHERE id = $1';
        const accountsQuery = 'SELECT * FROM accounts WHERE account_owner_id = $1 ORDER BY created_at DESC';
        const userResult = await db.query(userQuery, [id]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found." });
        const accountsResult = await db.query(accountsQuery, [id]);
        res.status(200).json({ user: userResult.rows[0], accounts: accountsResult.rows });
    } catch (error) {
        sendError(res, "Failed to fetch user details.", error);
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
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin accounts.", error);
    }
});

app.get("/api/admin/accounts/:id", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const accountQuery = 'SELECT a.*, u.user_name as account_owner_name FROM accounts a LEFT JOIN users u ON a.account_owner_id = u.id WHERE a.id = $1';
        const projectsQuery = 'SELECT p.*, u.user_name as project_owner_name FROM projects p LEFT JOIN users u ON p.project_owner_id = u.id WHERE p.account_id = $1 ORDER BY p.created_at DESC';
        const accountResult = await db.query(accountQuery, [id]);
        if (accountResult.rows.length === 0) return res.status(404).json({ error: "Account not found." });
        const projectsResult = await db.query(projectsQuery, [id]);
        res.status(200).json({ account: accountResult.rows[0], projects: projectsResult.rows });
    } catch (error) {
        sendError(res, "Failed to fetch account details.", error);
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
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin projects.", error);
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

        const [tasksResult, updatesResult] = await Promise.all([
            db.query(tasksQuery, [id]),
            db.query(updatesQuery, [id])
        ]);

        res.status(200).json({ project: projectResult.rows[0], tasks: tasksResult.rows, updates: updatesResult.rows });
    } catch (error) {
        sendError(res, "Failed to fetch project details.", error);
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
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin tasks.", error);
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
        res.status(200).json(result.rows);
    } catch (error) {
        sendError(res, "Failed to fetch admin updates.", error);
    }
});


// =================================================================
// --- REGULAR USER ENDPOINTS ---
// =================================================================

app.get("/api/users", async (req, res) => {
    try {
        const { rows } = await db.query("SELECT id, airtable_id, user_name FROM users ORDER BY user_name;");
        res.json(rows);
    } catch (err) {
        sendError(res, "Failed to fetch all users.", err);
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
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch accounts', err);
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
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch projects', err);
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
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch tasks', err);
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
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch tasks by creator', err);
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
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch updates', err);
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
        res.status(201).json(rows[0]);
    } catch (err) { sendError(res, 'Failed to create account.', err); }
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
        res.status(201).json(rows[0]);
    } catch (err) { sendError(res, 'Failed to create project.', err); }
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
        res.status(201).json(rows[0]);
    } catch (err) { 
        sendError(res, 'Failed to create task.', err); 
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
        res.status(201).json(rows[0]);
    } catch (err) {
        sendError(res, 'Failed to create update.', err);
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
        if (rows.length === 0) {
            return res.status(404).json({ error: "Project not found or no update was made." });
        }
        res.json(rows[0]);
    } catch (err) {
        sendError(res, "Failed to update project.", err);
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
        res.json(rows[0]);
    } catch (err) { sendError(res, "Failed to update task.", err); }
});

// Export the app for Vercel
module.exports = app;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getProjectsIPC = getProjectsIPC;
exports.createProjectIPC = createProjectIPC;
exports.getMembersIPC = getMembersIPC;
exports.createMemberIPC = createMemberIPC;
exports.addExpenseIPC = addExpenseIPC;
exports.getExpensesIPC = getExpensesIPC;
exports.generateBudgetPdf = generateBudgetPdf;
// src-electron/db/database.ts
const sql_js_1 = __importDefault(require("sql.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdf_lib_1 = require("pdf-lib");
// Configuración de rutas
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app.sqlite');
// Posibles rutas donde puede estar sql-wasm.wasm dependiendo de entorno (dev / electron dev / build)
const CANDIDATE_WASM_PATHS = [
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'), // dev (vite)
    path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'), // electron build / dist-electron
    path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'), // alternate
];
function findWasmFile() {
    for (const p of CANDIDATE_WASM_PATHS) {
        if (fs.existsSync(p))
            return p;
    }
    return null;
}
let SQL;
let db;
/**
 * Inicializa la DB. Es async.
 * Llama a await initDatabase() desde main.
 */
async function initDatabase() {
    try {
        // Asegurarse de que el directorio de datos existe
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        // Localizar el archivo WASM en una de las rutas candidatas
        const WASM_FILE = findWasmFile();
        if (!WASM_FILE) {
            throw new Error('Archivo WASM no encontrado en ninguna ruta candidata: ' + JSON.stringify(CANDIDATE_WASM_PATHS, null, 2));
        }
        console.log('Inicializando SQL.js con archivo WASM en:', WASM_FILE);
        // En entornos Node/Electron es más robusto pasar el binary directamente
        const wasmBinary = new Uint8Array(fs.readFileSync(WASM_FILE));
        // cast to any to satisfy TypeScript types for wasm binary in this Node environment
        SQL = await (0, sql_js_1.default)({ wasmBinary: wasmBinary });
        if (fs.existsSync(DB_FILE)) {
            const fileBuf = fs.readFileSync(DB_FILE);
            db = new SQL.Database(new Uint8Array(fileBuf));
        }
        else {
            db = new SQL.Database();
            createSchema();
            persist();
        }
    }
    catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}
function createSchema() {
    db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      team_id INTEGER,
      FOREIGN KEY(team_id) REFERENCES teams(id)
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      budget REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      member_id INTEGER,
      amount REAL,
      description TEXT,
      incurred_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(member_id) REFERENCES members(id)
    );
  `);
    // Migración: Agregar columna member_id si no existe
    try {
        const tableInfo = db.exec("PRAGMA table_info(expenses);");
        const columns = tableInfo.length > 0 ? tableInfo[0].values : [];
        const hasMemberIdColumn = columns.some(row => row[1] === 'member_id');
        if (!hasMemberIdColumn) {
            console.log('Agregando columna member_id a tabla expenses');
            db.run('ALTER TABLE expenses ADD COLUMN member_id INTEGER;');
            persist();
        }
    }
    catch (error) {
        console.log('La migración de member_id ya existe o hubo un error:', error);
    }
}
/** Guarda el estado actual de la DB en el archivo DB_FILE */
function persist() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
}
/** Helper: convertir resultado de db.exec a array de objetos */
function rowsFromExec(execResult) {
    if (!execResult || execResult.length === 0)
        return [];
    const { columns, values } = execResult[0];
    return values.map((row) => {
        const obj = {};
        row.forEach((v, i) => {
            obj[columns[i]] = v;
        });
        return obj;
    });
}
/** IPC handler functions (firman igual que antes) */
/** Devuelve todos los proyectos */
function getProjectsIPC() {
    const res = db.exec('SELECT * FROM projects ORDER BY created_at DESC');
    return rowsFromExec(res);
}
/** Crea un proyecto y devuelve { id } */
function createProjectIPC(_event, payload) {
    const stmt = db.prepare('INSERT INTO projects (name, description, budget) VALUES (?, ?, ?)');
    stmt.run([payload.name, payload.description || '', payload.budget ?? 0]);
    stmt.free();
    persist();
    const last = db.exec('SELECT last_insert_rowid() AS id');
    const id = (last?.[0]?.values?.[0]?.[0]) ?? null;
    return { id };
}
/** Devuelve todos los miembros */
function getMembersIPC() {
    const res = db.exec('SELECT * FROM members ORDER BY name');
    return rowsFromExec(res);
}
/** Crea un miembro y devuelve { id } */
function createMemberIPC(_event, payload) {
    const stmt = db.prepare('INSERT INTO members (name, role, email) VALUES (?, ?, ?)');
    stmt.run([payload.name, payload.role || '', payload.email || '']);
    stmt.free();
    persist();
    const last = db.exec('SELECT last_insert_rowid() AS id');
    const id = (last?.[0]?.values?.[0]?.[0]) ?? null;
    return { id };
}
/** Añade un gasto y devuelve { id } */
function addExpenseIPC(_event, payload) {
    const stmt = db.prepare('INSERT INTO expenses (project_id, member_id, amount, description) VALUES (?, ?, ?, ?)');
    stmt.run([payload.projectId, payload.memberId || null, payload.amount, payload.description || '']);
    stmt.free();
    persist();
    const last = db.exec('SELECT last_insert_rowid() AS id');
    const id = (last?.[0]?.values?.[0]?.[0]) ?? null;
    return { id };
}
/** Devuelve gastos de un proyecto con información del miembro */
function getExpensesIPC(_event, projectId) {
    // JOIN para obtener información del miembro que hizo el gasto
    const stmt = db.prepare(`
    SELECT e.*, m.name as member_name, m.role as member_role 
    FROM expenses e 
    LEFT JOIN members m ON e.member_id = m.id 
    WHERE e.project_id = ? 
    ORDER BY e.incurred_at DESC
  `);
    const rows = [];
    const iter = stmt.bind([projectId]);
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
/**
 * Genera un PDF (usando pdf-lib), lo guarda en disk y devuelve la ruta.
 * Retorna Promise<string>
 */
async function generateBudgetPdf(projectId) {
    try {
        console.log('Generando PDF para proyecto ID:', projectId);
        // Verificar que la base de datos está inicializada
        if (!db) {
            throw new Error('Database not initialized');
        }
        // obtener proyecto con prepared statement
        const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
        stmt.bind([projectId]);
        let project = null;
        if (stmt.step()) {
            project = stmt.getAsObject();
        }
        stmt.free();
        if (!project) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        console.log('Proyecto encontrado:', project.name);
        // obtener gastos con información del miembro
        const expStmt = db.prepare(`
      SELECT e.*, m.name as member_name, m.role as member_role 
      FROM expenses e 
      LEFT JOIN members m ON e.member_id = m.id 
      WHERE e.project_id = ? 
      ORDER BY e.incurred_at DESC
    `);
        expStmt.bind([projectId]);
        const expenses = [];
        while (expStmt.step()) {
            expenses.push(expStmt.getAsObject());
        }
        expStmt.free();
        console.log('Gastos encontrados:', expenses.length);
        // Asegurar que el directorio DATA_DIR existe
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        // crear PDF
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        let currentPage = pdfDoc.addPage();
        const { width, height } = currentPage.getSize();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        let cursorY = height - 60;
        const writeLine = (text, fontSize = 12) => {
            // Verificar si necesitamos una nueva página
            if (cursorY < 80) {
                currentPage = pdfDoc.addPage();
                cursorY = height - 60;
            }
            // Asegurar que el texto no sea undefined o null
            const safeText = String(text || '');
            currentPage.drawText(safeText, {
                x: 50,
                y: cursorY,
                size: fontSize,
                font: font
            });
            cursorY -= fontSize + 8;
        };
        // Escribir contenido del PDF
        writeLine(`REPORTE DE PRESUPUESTO`, 18);
        writeLine(``, 6); // espacio
        writeLine(`Proyecto: ${project.name || 'Sin nombre'}`, 14);
        writeLine(`Descripción: ${project.description || 'Sin descripción'}`, 12);
        writeLine(`Presupuesto inicial: $${Number(project.budget || 0).toFixed(2)}`, 12);
        writeLine(`Fecha: ${new Date().toLocaleDateString()}`, 10);
        writeLine(``, 6); // espacio
        writeLine(`GASTOS:`, 14);
        writeLine(``, 4); // espacio
        let total = 0;
        if (expenses.length === 0) {
            writeLine(`No hay gastos registrados`, 10);
        }
        else {
            for (const expense of expenses) {
                const amount = Number(expense.amount || 0);
                total += amount;
                const date = expense.incurred_at || 'Sin fecha';
                const description = expense.description || 'Sin descripción';
                const member = expense.member_name ? `${expense.member_name} (${expense.member_role || 'Sin rol'})` : 'Sin asignar';
                writeLine(`• ${date} - ${description}: $${amount.toFixed(2)}`, 10);
                writeLine(`  Realizado por: ${member}`, 9);
                writeLine(``, 3); // espacio pequeño entre gastos
            }
        }
        writeLine(``, 6); // espacio
        writeLine(`RESUMEN:`, 14);
        writeLine(`Total de gastos: $${total.toFixed(2)}`, 12);
        writeLine(`Presupuesto restante: $${(Number(project.budget || 0) - total).toFixed(2)}`, 12);
        // Guardar PDF
        const pdfBytes = await pdfDoc.save();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `budget-report-${projectId}-${timestamp}.pdf`;
        const outPath = path.join(DATA_DIR, filename);
        console.log('Guardando PDF en:', outPath);
        fs.writeFileSync(outPath, pdfBytes);
        console.log('PDF generado exitosamente');
        return outPath;
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate PDF: ${errorMessage}`);
    }
}

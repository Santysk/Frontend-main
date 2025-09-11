// src/api.js
// Usa el MISMO origen que el login. En .env del frontend pon:
// VITE_API_URL=http://localhost:8080
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

/* ======================================================================================
 * Utilidades comunes (fetch, parseo, etc.)
 * ====================================================================================*/

/** fetch con timeout para evitar esperas infinitas */
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Intenta parsear JSON si hay; si no, retorna texto; maneja 204 sin cuerpo. */
async function parseResponse(response) {
  const ct = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (ct.includes('application/json')) return await response.json();
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text || null; }
}

/** Helper genérico para requests JSON. */
async function request(path, {
  method = 'GET',
  json,
  headers,
  timeout = 15000,
  ...rest
} = {}) {
  const opts = {
    method,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
    ...rest,
  };

  const res = await fetchWithTimeout(`${BASE_URL}${path}`, opts, timeout);
  if (!res.ok) {
    const err = await parseResponse(res);
    throw new Error(err?.error || err?.message || `Error ${res.status}`);
  }
  return parseResponse(res);
}

/** Descarga de binarios (PDF) con filename desde Content-Disposition cuando existe. */
async function downloadPdf(path, fallbackName, { timeout = 60000 } = {}) {
  const res = await fetchWithTimeout(`${BASE_URL}${path}`, { method: 'GET' }, timeout);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error al generar PDF');
  }
  const blob = await res.blob();
  const fileUrl = URL.createObjectURL(blob);

  const disp = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
  let filename = fallbackName;
  if (disp && /filename/i.test(disp)) {
    const m = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    if (m?.[1]) filename = decodeURIComponent(m[1]);
  }

  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(fileUrl);
}

/* ======================================================================================
 * EMPLEADOS
 * ====================================================================================*/

export async function fetchEmployees() {
  return request('/empleados/todos');
}

export async function uploadEmployeesCSV(formData) {
  const res = await fetchWithTimeout(`${BASE_URL}/empleados/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await parseResponse(res);
    throw new Error(err?.message || err?.error || 'Error al subir el archivo CSV.');
  }
  return parseResponse(res);
}

export async function createEmployee(payload) {
  const data = await request('/empleados/registrar', { method: 'POST', json: payload })
    .catch((e) => { throw e; });
  return data || { message: 'Empleado guardado con éxito' };
}

export async function updateEmployee(employee) {
  return request(`/empleados/${employee.id}`, { method: 'PUT', json: employee });
}

export async function deleteEmployee(id) {
  return request(`/empleados/${id}`, { method: 'DELETE' });
}

export async function fetchEmployeeById(id) {
  const res = await fetchWithTimeout(`${BASE_URL}/empleados/${id}`, { method: 'GET' });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error('Empleado no encontrado');
  return parseResponse(res);
}

/** Activar/Desactivar empleado */
export async function toggleEmployeeStatus(id, activo) {
  return request(`/empleados/${id}/estado?activo=${activo}`, { method: 'PATCH' });
}

/* ======================================================================================
 * REGISTROS (TURNOS)
 * ====================================================================================*/

export async function fetchRegistros() {
  return request('/registros');
}

export async function createRegistro(registro) {
  return request('/registros', { method: 'POST', json: registro });
}

export async function fetchRegistrosByEmployeeId(employeeId) {
  const res = await fetchWithTimeout(`${BASE_URL}/registros/empleado/${employeeId}`, { method: 'GET' });
  if (res.status === 204) return [];
  if (!res.ok) throw new Error('Error al obtener registros de turno del empleado');
  return parseResponse(res);
}

/* ======================================================================================
 * LOGIN
 * ====================================================================================*/

export async function loginUser({ correo, contrasena }) {
  const url = `/users/login?correo=${encodeURIComponent(correo)}&contrasena=${encodeURIComponent(contrasena)}`;
  return request(url, { method: 'GET' }); // { correo, rol }
}

// Alternativa POST
export async function loginUserPost({ correo, contrasena }) {
  return request('/users/login', { method: 'POST', json: { correo, contrasena } });
}

/* ======================================================================================
 * REPORTES (PDF)
 * ====================================================================================*/

export const exportEmployeesPdf = () =>
  downloadPdf('/reports/employees/pdf', 'reporte_empleados.pdf');

export const exportShiftsPdf = () =>
  downloadPdf('/reports/shifts/pdf', 'reporte_registros_turno.pdf');

export const exportEmployeeHistoryPdf = (employeeId) =>
  downloadPdf(`/reports/employee/${employeeId}/pdf`, `historial_turnos_${employeeId}.pdf`);

export async function exportShiftsPdfByRange({ from, to } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to)   qs.set('to', to);
  const query = qs.toString();
  const path = `/reports/shifts/pdf${query ? `?${query}` : ''}`;
  return downloadPdf(path, 'reporte_registros_turno_rango.pdf');
}
export { exportShiftsPdfByRange as exportShiftsPdfRange };

/* ======================================================================================
 * SESIÓN DEL SISTEMA (helpers de persistencia en localStorage)
 * ====================================================================================*/

export function saveAdminSession(data) {
  try { localStorage.setItem('user', JSON.stringify(data)); } catch {}
}
export function readAdminSession() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearAdminSession() {
  try { localStorage.removeItem('user'); } catch {}
}

/** Sesión de KIOSKO (empleado por ID). */
const KIOSK_MODE_KEY = 'kioskMode';
const KIOSK_EMP_KEY  = 'kioskEmployeeId';

export function persistKioskSession(employeeId) {
  try {
    localStorage.setItem(KIOSK_MODE_KEY, '1');
    localStorage.setItem(KIOSK_EMP_KEY, String(employeeId));
  } catch {}
}

export function readKioskSession() {
  try {
    const enabled = localStorage.getItem(KIOSK_MODE_KEY) === '1';
    const empRaw  = localStorage.getItem(KIOSK_EMP_KEY);
    const employeeId = empRaw ? Number(empRaw) : null;
    return { enabled, employeeId };
  } catch {
    return { enabled: false, employeeId: null };
  }
}

export function clearKioskSession() {
  try {
    localStorage.removeItem(KIOSK_MODE_KEY);
    localStorage.removeItem(KIOSK_EMP_KEY);
  } catch {}
}

/* ======================================================================================
 * PERSISTENCIA PARA ADMIN (vista y borrador de "Nuevo Empleado")
 * ====================================================================================*/

// Guardar / leer / limpiar la última vista del admin (por ejemplo "new")
export function persistAdminView(view) {
  try { localStorage.setItem('adminLastView', view); } catch {}
}
export function readAdminView() {
  try { return localStorage.getItem('adminLastView') || null; } catch { return null; }
}
export function clearAdminView() {
  try { localStorage.removeItem('adminLastView'); } catch {}
}

// Borrador del formulario de "Nuevo Empleado"
const NEW_EMPLOYEE_DRAFT_KEY = 'newEmployeeDraft';

export function persistNewEmployeeDraft(form) {
  try { localStorage.setItem(NEW_EMPLOYEE_DRAFT_KEY, JSON.stringify(form || {})); } catch {}
}
export function readNewEmployeeDraft() {
  try {
    const raw = localStorage.getItem(NEW_EMPLOYEE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearNewEmployeeDraft() {
  try { localStorage.removeItem(NEW_EMPLOYEE_DRAFT_KEY); } catch {}
}

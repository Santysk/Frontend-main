// api.js
// Usa el MISMO origen que el login. En .env del frontend pon: VITE_API_URL=http://localhost:8080
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

// Helper: parsea JSON si hay; si no, intenta texto; maneja 204 sin cuerpo.
async function parseResponse(response) {
  const ct = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (ct.includes('application/json')) return await response.json();
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text || null; }
}

// ================= EMPLEADOS =================

export async function fetchEmployees() {
  const response = await fetch(`${BASE_URL}/empleados/todos`);
  if (!response.ok) throw new Error('Error al obtener empleados');
  return parseResponse(response);
}

export async function uploadEmployeesCSV(formData) {
  const response = await fetch(`${BASE_URL}/empleados/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const err = await parseResponse(response);
    throw new Error((err && (err.message || err.error)) || 'Error al subir el archivo CSV.');
  }
  return parseResponse(response);
}

export async function createEmployee(payload) {
  const resp = await fetch(`${BASE_URL}/empleados/registrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!resp.ok) {
    throw new Error(data?.error || `Error ${resp.status}`);
  }
  // si el backend no devuelve JSON, regresamos un objeto de éxito
  return data || { message: 'Empleado guardado con éxito' };
}

export async function updateEmployee(employee) {
  const response = await fetch(`${BASE_URL}/empleados/${employee.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  if (!response.ok) {
    const err = await parseResponse(response);
    throw new Error((err && (err.error || err.message)) || 'Error al actualizar empleado');
  }
  return parseResponse(response);
}

export async function deleteEmployee(id) {
  const response = await fetch(`${BASE_URL}/empleados/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const err = await parseResponse(response);
    throw new Error((err && (err.error || err.message)) || 'Error al eliminar empleado');
  }
  return parseResponse(response); // puede ser null si 204
}

// ================= REGISTROS (TURNOS) =================

export async function fetchRegistros() {
  const response = await fetch(`${BASE_URL}/registros`);
  if (!response.ok) throw new Error('Error al obtener registros de turno');
  return parseResponse(response);
}

export async function createRegistro(registro) {
  const response = await fetch(`${BASE_URL}/registros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro),
  });
  if (!response.ok) {
    const err = await parseResponse(response);
    throw new Error((err && (err.error || err.message)) || 'Error al crear registro');
  }
  return parseResponse(response);
}

export async function fetchRegistrosByEmployeeId(employeeId) {
  const response = await fetch(`${BASE_URL}/registros/empleado/${employeeId}`);
  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Error al obtener registros de turno del empleado');
  return parseResponse(response);
}

// ================= EMPLEADO POR ID =================

export async function fetchEmployeeById(id) {
  const response = await fetch(`${BASE_URL}/empleados/${id}`);
  if (response.status === 204) return null;
  if (!response.ok) throw new Error('Empleado no encontrado');
  return parseResponse(response);
}

// ================= LOGIN (GET, como en tu Login.jsx) =================

export async function loginUser({ correo, contrasena }) {
  const url = `${BASE_URL}/users/login?correo=${encodeURIComponent(correo)}&contrasena=${encodeURIComponent(contrasena)}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    const err = await parseResponse(response);
    throw new Error((err && err.error) || 'Error al iniciar sesión');
  }
  return parseResponse(response); // { correo, rol }
}

// ================= REPORTES (PDF) =================

async function downloadPdf(path, fallbackName) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'GET' });
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

export async function toggleEmployeeStatus(id, activo) {
  const res = await fetch(`${BASE_URL}/empleados/${id}/estado?activo=${activo}`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await parseResponse(res);
    throw new Error((err && (err.error || err.message)) || 'Error al actualizar estado del empleado');
  }
  return parseResponse(res);
}

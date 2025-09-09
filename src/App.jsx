import React, { useEffect, useState } from 'react';
import Login from './components/login';
import EmployeeList from './components/EmployeeList';
import NewEmployee from './components/NewEmployee';
import RegisterShiftForm from './components/RegisterShiftForm';
import ShiftList from './components/ShiftList';
import EditEmployee from './components/EditEmployee';
import EmployeeShiftHistory from './components/EmployeeShiftHistory';
import Reports from './components/Reports';
import { createEmployee, updateEmployee } from './api';
import './App.css';

export default function App() {
  // Sesión admin { correo, rol } (persistida en localStorage por Login)
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const isLoggedIn = !!user;
  const isAdmin = user?.rol === 'ADMIN';

  // Vistas del panel admin
  const [view, setView] = useState('list'); // 'list', 'new', 'registerShift', 'shiftList', 'edit', 'employeeShiftHistory', 'reports'
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeIdForHistory, setEmployeeIdForHistory] = useState(null);

  // Para refrescar la lista tras agregar/editar
  const [refreshList, setRefreshList] = useState(false);

  // === NUEVO: modo kiosko (login por ID sin rol) ===
  const [kioskMode, setKioskMode] = useState(false);
  const [kioskEmpId, setKioskEmpId] = useState(null); // ID que llega desde el login por ID

  // Mantener sesión al recargar (si cambia localStorage desde otra pestaña)
  useEffect(() => {
    const onStorage = () => {
      const raw = localStorage.getItem('user');
      setUser(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Handler de login (admin): recibe { correo, rol } desde <Login />
  const handleLogin = (data) => {
    setUser(data);   // data = { correo, rol }
    setKioskMode(false);
    setKioskEmpId(null);
    setView('list');
  };

  // === NUEVO: handler de login por ID (kiosko) ===
  const handleKioskLogin = (id) => {
    setKioskMode(true);
    setKioskEmpId(id);
    setView('registerShift'); // vamos directo a Registrar Turno
  };

  // Handler de logout (admin)
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setKioskMode(false);
    setKioskEmpId(null);
    setView('list');
    setEmployeeToEdit(null);
    setEmployeeIdForHistory(null);
  };

  // ======= Rutas públicas (no logueado) =======
  if (!isLoggedIn && !kioskMode) {
    // Mostrar login con dos entradas: admin y kiosko
    return <Login onLogin={handleLogin} onKioskLogin={handleKioskLogin} />;
  }

  // ======= Modo KIOSKO (sin rol, solo registrar turno) =======
  if (kioskMode) {
    return (
      <div className="app-container" style={{ padding: 16 }}>
        {/* Barra simple para salir del kiosko */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          {/*<button onClick={() => { setKioskMode(false); setKioskEmpId(null); setView('list'); }}>
            Salir
          </button>*/}
        </div>

        <RegisterShiftForm
          initialEmployeeId={kioskEmpId}     // 👈 auto-busca al entrar
          onCancel={() => { setKioskMode(false); setKioskEmpId(null); setView('list'); }}
          onSave={() => { /* tras registrar turno, te puedes quedar o salir */ }}
        />
      </div>
    );
  }

  // ======= Logueado y NO admin: bloquea panel =======
  if (!isAdmin) {
    return (
      <div className="app-container" style={{ padding: 24 }}>
        <h2>No tienes permiso para ver esta sección</h2>
        <p>
          Iniciaste sesión como <b>{user?.correo}</b> con rol <b>{user?.rol}</b>.
        </p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    );
  }

  // ======= Panel ADMIN =======
  return (
    <div className="app-container">
      {view === 'list' && (
        <EmployeeList
          onLogout={handleLogout}
          onCreateNew={() => setView('new')}
          onRegisterShift={() => { setKioskMode(false); setKioskEmpId(null); setView('registerShift'); }}
          onViewShifts={() => setView('shiftList')}
          onEditEmployee={(employee) => { setEmployeeToEdit(employee); setView('edit'); }}
          onViewEmployeeHistory={(id) => { setEmployeeIdForHistory(id); setView('employeeShiftHistory'); }}
          onGenerateReports={() => setView('reports')}
          refresh={refreshList}
          setRefresh={setRefreshList}
        />
      )}

      {view === 'new' && (
        <NewEmployee
          onCancel={() => setView('list')}
          onSave={async (employeeData) => {
            try {
              await createEmployee(employeeData);
              setView('list');
              setRefreshList((r) => !r);
            } catch (error) {
              console.error('Error saving employee:', error);
              alert('Error al guardar empleado. Por favor, inténtalo de nuevo.');
            }
          }}
        />
      )}

      {view === 'edit' && (
        <EditEmployee
          employee={employeeToEdit}
          onCancel={() => { setEmployeeToEdit(null); setView('list'); }}
          onSave={async (updatedEmployeeData) => {
            try {
              await updateEmployee(updatedEmployeeData);
              setEmployeeToEdit(null);
              setView('list');
              setRefreshList((r) => !r);
            } catch (error) {
              console.error('Error updating employee:', error);
              alert('Error al actualizar empleado. Por favor, inténtalo de nuevo.');
            }
          }}
        />
      )}

      {view === 'registerShift' && (
        <RegisterShiftForm
          initialEmployeeId={kioskEmpId}     // 👈 también funciona desde admin si quieres precargar
          onCancel={() => setView('list')}
          onSave={() => { setView('list'); }}
        />
      )}

      {view === 'shiftList' && <ShiftList onBack={() => setView('list')} />}

      {view === 'employeeShiftHistory' && (
        <EmployeeShiftHistory
          employeeId={employeeIdForHistory}
          onBack={() => { setEmployeeIdForHistory(null); setView('list'); }}
        />
      )}

      {view === 'reports' && <Reports onBack={() => setView('list')} />}
    </div>
  );
}

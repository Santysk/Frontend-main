import React, { useState } from 'react';

export default function AttendanceForm({ onRegisterAttendance }) {
  const [cedula, setCedula] = useState('');
  const [tipo, setTipo] = useState('entrada'); // 'entrada' o 'salida'
  const [departamento, setDepartamento] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cedula || !departamento) {
      alert('Por favor ingresa cédula y departamento');
      return;
    }

    if (onRegisterAttendance) {
      onRegisterAttendance({ cedula, tipo, departamento });
    }

    setCedula('');
    setDepartamento('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registrar entrada/salida</h2>
      <input
        type="text"
        placeholder="Cédula del empleado"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Departamento"
        value={departamento}
        onChange={(e) => setDepartamento(e.target.value)}
        required
      />
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="entrada">Entrada</option>
        <option value="salida">Salida</option>
      </select>

      <button type="submit">Registrar</button>
    </form>
  );
}

import React, { useState } from 'react';
import { uploadEmployeesCSV } from '../api';
import './ImportEmployees.css';

export default function ImportEmployees({ onClose, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [type, setType] = useState(''); // 'ok' | 'err'
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
    setMessage('');
    setType('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor, selecciona un archivo CSV.');
      setType('err');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const resp = await uploadEmployeesCSV(formData);
      setMessage((resp && (resp.message || resp)) || 'Empleados importados exitosamente.');
      setType('ok');

      // refresca lista y cierra
      onImportSuccess?.();
      setTimeout(() => onClose?.(), 800);
    } catch (err) {
      console.error(err);
      setMessage(err?.message || 'Error al importar empleados.');
      setType('err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-overlay" role="dialog" aria-modal="true">
      <div className="import-modal">
        <h2 className="im-title">Importar empleados (CSV)</h2>
        <p className="im-help">Selecciona un archivo <b>.csv</b> con las columnas esperadas.</p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="im-file"
        />

        <div className="im-actions">
          <button
            className="im-btn im-primary"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Importando…' : 'Importar'}
          </button>
          <button className="im-btn im-cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>

        {message && (
          <div className={`im-msg ${type === 'ok' ? 'im-ok' : 'im-err'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

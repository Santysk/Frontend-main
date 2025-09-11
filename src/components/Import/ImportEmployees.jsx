import React, { useState } from 'react';
import { uploadEmployeesCSV } from '../../api';
// ❌ Quita la importación de CSS externo si la tienes
// import './ImportEmployees.css';

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
    <>
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

      {/* ===== CSS integrado ===== */}
      <style>{`
/* Capa oscura detrás del modal */
.import-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

/* Caja del modal */
.import-modal {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.25);
  padding: 22px;
  animation: im-fade 0.18s ease-out;
  color: #111827;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

.im-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
}

.im-help {
  margin: 0 0 14px;
  font-size: 14px;
  color: #4b5563;
}

/* Input de archivo */
.im-file {
  width: 100%;
  margin: 8px 0 16px;
}

/* Botones */
.im-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.im-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: transform .08s ease, background .2s ease, opacity .2s ease;
}

.im-btn:disabled {
  opacity: .6; cursor: not-allowed;
}

.im-primary {
  color: #fff;
  background: linear-gradient(90deg, #0b7a35, #0a5a28);
}
.im-primary:hover:not(:disabled) { transform: translateY(-1px); }

.im-cancel {
  background: #e5e7eb;
  color: #111827;
}
.im-cancel:hover { background: #d1d5db; }

/* Mensajes */
.im-msg {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  text-align: center;
}
.im-ok  { background: #e8f6ee; color: #166534; border: 1px solid #ccead8; }
.im-err { background: #fde2e2; color: #991b1b; border: 1px solid #f5c2c2; }

@keyframes im-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
      `}</style>
    </>
  );
}

// frontend/src/components/PasswordRecovery.js - SIN CÓDIGO DE DESARROLLO
import React, { useState } from 'react';
import axios from 'axios';

const PasswordRecovery = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: email, 2: código + nueva contraseña
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/recuperar-password', { email });
      if (response.data.success) {
        setMensaje('Código enviado a tu email. Revisa tu bandeja de entrada y spam.');
        setStep(2);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetearPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/resetear-password', {
        email,
        codigo: codigo.trim(),
        nuevaPassword
      });
      
      if (response.data.success) {
        setMensaje('¡Contraseña actualizada exitosamente!');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al resetear contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/reenviar-codigo', {
        email,
        tipo: 'recuperacion'
      });

      if (response.data.success) {
        setMensaje('Nuevo código enviado a tu email');
        setCodigo(''); // Limpiar código anterior
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-auth" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3>🔐 Recuperar Contraseña</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'center',
              border: '1px solid #e74c3c'
            }}>
              {error}
            </div>
          )}

          {mensaje && (
            <div style={{
              background: '#e8f5e8',
              color: '#2d5a2d',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'center',
              border: '1px solid #27ae60'
            }}>
              {mensaje}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleEnviarCodigo}>
              <p style={{ marginBottom: '20px', textAlign: 'center' }}>
                Ingresa tu email para recibir un código de recuperación
              </p>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetearPassword}>
              <p style={{ marginBottom: '20px', textAlign: 'center', lineHeight: '1.5' }}>
                Hemos enviado un código a:<br/>
                <strong style={{ color: '#3498db' }}>{email}</strong>
              </p>

              <div style={{ 
                background: '#e8f4fd', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                textAlign: 'center',
                border: '1px solid #3498db'
              }}>
                📬 <strong>Revisa tu bandeja de entrada y spam</strong>
              </div>

              <div className="form-group">
                <label>Código de Verificación:</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  required
                  className="form-input"
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '18px',
                    letterSpacing: '2px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Ingresa el código de 6 dígitos que recibiste por email
                </small>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña:</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || codigo.length !== 6}
                >
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>

              {/* Botón para reenviar código */}
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={handleReenviarCodigo}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3498db',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Reenviando...' : '📨 Reenviar código'}
                </button>
              </div>

              <div style={{ 
                background: '#fff3cd', 
                padding: '12px', 
                borderRadius: '8px',
                marginTop: '15px',
                fontSize: '13px',
                textAlign: 'center',
                border: '1px solid #ffeaa7',
                color: '#856404'
              }}>
                ⏰ <strong>Importante:</strong> El código expira en 15 minutos
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordRecovery;
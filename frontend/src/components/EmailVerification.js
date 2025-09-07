// frontend/src/components/EmailVerification.js - SIN CÓDIGO DE DESARROLLO
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailVerification = ({ email, onVerified, onClose }) => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(60);
  const [puedeReenviar, setPuedeReenviar] = useState(false);

  // Contador para reenvío
  useEffect(() => {
    if (tiempoRestante > 0) {
      const timer = setTimeout(() => {
        setTiempoRestante(tiempoRestante - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setPuedeReenviar(true);
    }
  }, [tiempoRestante]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verificar-email', {
        email,
        codigo: codigo.trim()
      });

      if (response.data.success) {
        setMensaje('¡Email verificado exitosamente!');
        setTimeout(() => {
          onVerified();
        }, 1500);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Código inválido');
      } else {
        setError('Error al verificar. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    setReenviando(true);
    setError('');
    setMensaje('');

    try {
      const response = await axios.post('/api/auth/reenviar-codigo', {
        email,
        tipo: 'verificacion'
      });

      if (response.data.success) {
        setMensaje('Nuevo código enviado a tu email');
        setTiempoRestante(60);
        setPuedeReenviar(false);
        setCodigo(''); // Limpiar código anterior
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al reenviar código');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-auth" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3>📧 Verificar Email</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '20px', textAlign: 'center', lineHeight: '1.5' }}>
            Hemos enviado un código de verificación a:<br/>
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
            📬 <strong>Revisa tu bandeja de entrada y spam</strong><br/>
            El email puede tardar unos minutos en llegar
          </div>

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

          <form onSubmit={handleSubmit}>
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
                disabled={loading || codigo.length !== 6}
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>

          {/* Botón para reenviar código */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {puedeReenviar ? (
              <button
                type="button"
                onClick={handleReenviar}
                disabled={reenviando}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3498db',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {reenviando ? 'Reenviando...' : '📨 Reenviar código'}
              </button>
            ) : (
              <span style={{ color: '#666', fontSize: '14px' }}>
                Podrás reenviar el código en {tiempoRestante}s
              </span>
            )}
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
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
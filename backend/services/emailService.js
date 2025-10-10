// backend/services/emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generar código de 6 dígitos
const generarCodigo = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Plantilla HTML para verificación de email
const plantillaVerificacion = (codigo, nombre) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verificar Email - Globos y Fiesta</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .code-box { background: #f8f9fa; border: 2px dashed #3498db; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .code { font-size: 32px; font-weight: bold; color: #3498db; letter-spacing: 3px; font-family: 'Courier New', monospace; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎈 Globos y Fiesta</h1>
            <h2>Verificación de Email</h2>
        </div>
        <div class="content">
            <h3>¡Hola ${nombre}!</h3>
            <p>Gracias por registrarte en Globos y Fiesta. Para completar tu registro, por favor verifica tu email usando el código de abajo:</p>
            
            <div class="code-box">
                <div class="code">${codigo}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Código de verificación</p>
            </div>
            
            <p><strong>Este código expira en 15 minutos.</strong></p>
            <p>Si no solicitaste este registro, puedes ignorar este email.</p>
            
            <p>¡Esperamos hacer tu próxima celebración increíble!</p>
        </div>
        <div class="footer">
            <p>Globos y Fiesta - Todo para hacer tu celebración especial</p>
            <p>Este es un email automático, por favor no respondas.</p>
        </div>
    </div>
</body>
</html>
`;

// Plantilla HTML para recuperación de contraseña
const plantillaRecuperacion = (codigo, nombre) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Recuperar Contraseña - Globos y Fiesta</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .code-box { background: #fff3cd; border: 2px dashed #f39c12; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 3px; font-family: 'Courier New', monospace; }
        .warning { background: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Globos y Fiesta</h1>
            <h2>Recuperación de Contraseña</h2>
        </div>
        <div class="content">
            <h3>Hola ${nombre},</h3>
            <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para crear una nueva contraseña:</p>
            
            <div class="code-box">
                <div class="code">${codigo}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Código de recuperación</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Este código expira en 15 minutos</li>
                    <li>Si no solicitaste este cambio, ignora este email</li>
                    <li>Nunca compartas este código con nadie</li>
                </ul>
            </div>
            
            <p>Si no puedes restablecer tu contraseña, contacta con nosotros.</p>
        </div>
        <div class="footer">
            <p>Globos y Fiesta - Todo para hacer tu celebración especial</p>
            <p>Este es un email automático, por favor no respondas.</p>
        </div>
    </div>
</body>
</html>
`;

// Enviar email de verificación
const enviarEmailVerificacion = async (email, nombre, codigo) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Globos y Fiesta <onboarding@resend.dev>',
            to: email,
            subject: '🎈 Verifica tu email - Globos y Fiesta',
            html: plantillaVerificacion(codigo, nombre)
        });

        if (error) {
            console.error('❌ Error enviando email:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Email de verificación enviado:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Error enviando email de verificación:', error);
        return { success: false, error: error.message };
    }
};

// Enviar email de recuperación
const enviarEmailRecuperacion = async (email, nombre, codigo) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Globos y Fiesta <onboarding@resend.dev>',
            to: email,
            subject: '🔐 Recuperar contraseña - Globos y Fiesta',
            html: plantillaRecuperacion(codigo, nombre)
        });

        if (error) {
            console.error('❌ Error enviando email:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Email de recuperación enviado:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Error enviando email de recuperación:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generarCodigo,
    enviarEmailVerificacion,
    enviarEmailRecuperacion
};
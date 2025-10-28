import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { token, PayerID, course_slug } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pago - Archub</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #dc2626;">⚠️ Error</h1>
              <p>No se encontró el token del pago.</p>
              <p style="margin-top: 1rem;">
                <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
              </p>
            </div>
          </body>
        </html>
      `);
    }

    const courseSlug = typeof course_slug === 'string' ? course_slug : 'master-archicad';

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Procesando Pago - Archub</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
            <h1 style="color: #16a34a;">✅ Pago Exitoso</h1>
            <p>Tu pago ha sido procesado correctamente.</p>
            <p style="color: #6b7280;">Redirigiendo al curso...</p>
          </div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = '/learning/courses/${courseSlug}';
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (e: any) {
    console.error('Error en capture-and-redirect:', e);
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Archub</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626;">⚠️ Error</h1>
            <p>Hubo un problema al procesar tu pago.</p>
            <p style="margin-top: 1rem;">
              <a href="/learning/courses" style="color: #2563eb; text-decoration: none;">Volver a Capacitaciones</a>
            </p>
          </div>
        </body>
      </html>
    `);
  }
}

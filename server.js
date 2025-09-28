// server.js

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns'); // Módulo de Node.js para la validación DNS
const url = require('url'); // Módulo de Node.js para parsear URLs

// Configuración del puerto
const port = process.env.PORT || 3000;

// Habilitar CORS
app.use(cors({ optionsSuccessStatus: 200 })); 

// ----------------------------------------------------------------------
// MIDDLEWARE: body-parser para manejar datos POST
// ----------------------------------------------------------------------
app.use(bodyParser.urlencoded({ extended: false }));

// ----------------------------------------------------------------------
// ALMACENAMIENTO EN MEMORIA (Reemplazo simple de la base de datos)
// ----------------------------------------------------------------------
// Objeto que almacena el mapeo: { short_id: original_url }
const urlStore = {}; 
let shortIdCounter = 1;

// ----------------------------------------------------------------------
// RUTA DE INICIO
// ----------------------------------------------------------------------
app.get('/', (req, res) => {
  // Una página de inicio simple para mostrar el formulario
  res.send(`
    <style>
      body { font-family: sans-serif; padding: 50px; text-align: center; background-color: #f0f4f8; }
      h1 { color: #333; }
      form { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; }
      input[type="url"] { padding: 10px; width: 300px; margin-right: 10px; border: 1px solid #ccc; border-radius: 4px; }
      button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
      button:hover { background-color: #0056b3; }
      p { margin-top: 20px; font-size: 0.9em; color: #666; }
    </style>
    <h1>URL Shortener Microservice</h1>
    <form action="/api/shorturl" method="POST">
      <label for="url_input">Introduce una URL para acortar:</label><br><br>
      <input id="url_input" type="url" name="url" placeholder="https://www.google.com" required>
      <button type="submit">Acortar URL</button>
    </form>
    <p>Nota: La validación requiere que la URL incluya el protocolo (e.g., https://) y sea una dirección válida.</p>
  `);
});

// ----------------------------------------------------------------------
// RUTA POST: CREAR NUEVA URL CORTA
// ----------------------------------------------------------------------
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // 1. Validar el formato de la URL
  let hostname;
  try {
    const parsedUrl = url.parse(originalUrl);
    hostname = parsedUrl.hostname;
    
    // Si no hay protocolo o hostname, es inválida
    if (!hostname || !parsedUrl.protocol) {
      return res.json({ error: 'invalid url' });
    }
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  // 2. Validar la existencia del Hostname usando DNS
  // dns.lookup verifica si el hostname se puede resolver a una IP
  dns.lookup(hostname, (err) => {
    if (err) {
      // Si hay un error DNS (no se encuentra la IP), la URL es inválida.
      return res.json({ error: 'invalid url' });
    }

    // 3. Si la validación DNS es exitosa, guardar el enlace.
    const shortUrl = shortIdCounter++;
    urlStore[shortUrl] = originalUrl;

    // 4. Devolver la respuesta JSON
    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// ----------------------------------------------------------------------
// RUTA GET: REDIRECCIONAR URL CORTA
// ----------------------------------------------------------------------
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;

  // Buscar la URL original en el almacenamiento
  const originalUrl = urlStore[shortUrl];

  if (originalUrl) {
    // Si se encuentra, redirigir al cliente
    return res.redirect(originalUrl);
  } else {
    // Si no se encuentra, devolver un error
    return res.json({ error: 'No short URL found for the given input' });
  }
});

// ----------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ----------------------------------------------------------------------

app.listen(port, () => {
  console.log(`URL Shortener escuchando en el puerto ${port}`);
});

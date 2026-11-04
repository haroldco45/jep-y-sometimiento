// Imagen de vista previa con FOTO REAL — JEP y Sometimiento · Vibras Positivas HM
// La corre GitHub Actions después del robot. Toma la foto más reciente de una nota
// sobre la ley de sometimiento y arma og-image.jpg (1200x630) con el título encima.
// Solo la cambia cuando aparece una foto nueva.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const TEMA = /sometimiento|paz total|ley 418|de la espriella|cancino/i;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const datos = JSON.parse(await readFile('noticias.json', 'utf8'));
const notas = (datos.noticias || [])
  .filter(n => n.imagen && TEMA.test(n.titulo))
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

let previa = '';
try { previa = (await readFile('og-fuente.txt', 'utf8')).trim(); } catch {}

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const n of notas.slice(0, 8)) {
  if (n.imagen === previa) { console.log('La foto no ha cambiado'); process.exit(0); }
  try {
    const r = await fetch(n.imagen, { headers: { 'User-Agent': UA, Referer: n.enlace } });
    if (!r.ok) continue;
    const buf = Buffer.from(await r.arrayBuffer());
    const meta = await sharp(buf).metadata();
    if (!meta.width || meta.width < 500) continue;

    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#0a1d31" stop-opacity=".95"/>
        <stop offset=".55" stop-color="#0a1d31" stop-opacity=".75"/>
        <stop offset="1" stop-color="#0a1d31" stop-opacity=".05"/></linearGradient></defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect width="600" height="10" fill="#c99a2e"/><rect x="600" width="600" height="10" fill="#b23a3a"/>
      <text x="64" y="110" font-family="DejaVu Sans, Arial" font-weight="700" font-size="24" letter-spacing="3" fill="#c99a2e">LEY DE SOMETIMIENTO · AL DÍA</text>
      <text x="64" y="200" font-family="DejaVu Serif, Georgia" font-weight="700" font-size="70" fill="#fff">JEP y Sometimiento</text>
      <text x="64" y="282" font-family="DejaVu Serif, Georgia" font-weight="700" font-size="70" fill="#c99a2e">al Día</text>
      <text x="64" y="360" font-family="DejaVu Sans, Arial" font-size="30" fill="#fff">Aprobada: Senado 57–24 · Cámara 95–10</text>
      <text x="64" y="404" font-family="DejaVu Sans, Arial" font-size="30" fill="#fff">Lo que dice la ley y quién votó no</text>
      <rect x="64" y="452" width="300" height="56" rx="14" fill="#b23a3a"/>
      <text x="86" y="489" font-family="DejaVu Sans, Arial" font-weight="700" font-size="24" fill="#fff">Derecho de petición</text>
      <text x="64" y="574" font-family="DejaVu Sans, Arial" font-weight="700" font-size="26" fill="#fff">jep-y-sometimiento.netlify.app</text>
      <text x="1180" y="618" text-anchor="end" font-family="DejaVu Sans, Arial" font-size="15" fill="#fff" fill-opacity=".8">Foto: ${esc(n.fuente || '')}</text>
    </svg>`;

    const out = await sharp(buf)
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .composite([{ input: Buffer.from(svg) }])
      .jpeg({ quality: 84 })
      .toBuffer();
    await writeFile('og-image.jpg', out);
    await writeFile('og-fuente.txt', n.imagen + '\n');
    console.log('Nueva vista previa con foto de', n.fuente, '-', n.titulo);
    process.exit(0);
  } catch (e) { console.log('No se pudo con', n.imagen, e.message); }
}
console.log('Sin foto nueva utilizable; se deja la vista previa anterior');

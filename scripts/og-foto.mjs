// Imagen de vista previa y flyer con FOTO REAL — JEP y Sometimiento · Vibras Positivas HM
// La corre GitHub Actions después del robot. Baja una foto real del Capitolio Nacional
// (sede del Congreso) desde Wikimedia Commons y arma:
//   og-image.jpg (1200x630) — la imagen que sale al compartir el enlace
//   flyer.png    (1080x1350) — flyer para redes, con capturas de la app (assets/)
// Solo las vuelve a hacer cuando cambia VERSION (el texto) o la foto.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const VERSION = 'ya-es-ley-2640-v1';
const URL_APP = 'jep-y-sometimiento.netlify.app';
const UA = 'VibrasPositivasHM-robot/1.0 (https://github.com/haroldco45/jep-y-sometimiento)';

// Fotos reales del Capitolio Nacional, en orden de preferencia.
const FOTOS = [
  { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Capitalio_National_de_Colombia,_Bogot%C3%A1.jpg?width=2400',
    credito: 'Foto: Capitolio Nacional, Bogotá · Bernard Gagnon / Wikimedia Commons (CC BY-SA)' },
  { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/El_Capitolio_Nacional_(Bogot%C3%A1,_Colombia)_1.jpg?width=2400',
    credito: 'Foto: Capitolio Nacional, Bogotá · Rikimedia / Wikimedia Commons (CC BY-SA)' },
];

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SANS = 'DejaVu Sans, Arial, sans-serif';
const SERIF = 'DejaVu Serif, Georgia, serif';

let previa = '';
try { previa = (await readFile('og-fuente.txt', 'utf8')).trim(); } catch {}

async function bajarFoto() {
  if (process.env.FOTO_LOCAL) return { buf: await readFile(process.env.FOTO_LOCAL), credito: 'Foto: prueba local' };
  for (const f of FOTOS) {
    try {
      const r = await fetch(f.url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!r.ok) { console.log('No bajó', f.url, r.status); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if (meta.width && meta.width >= 1000) return { buf, credito: f.credito, url: f.url };
    } catch (e) { console.log('Error con', f.url, e.message); }
  }
  return null;
}

// Celular con captura real de la app, bordes redondeados y marco oscuro.
async function celular(archivo, ancho) {
  const alto = Math.round(ancho * 2);
  const radio = Math.round(ancho * 0.11), borde = Math.round(ancho * 0.035);
  const inner = { w: ancho - borde * 2, h: alto - borde * 2 };
  const captura = await sharp(archivo).resize(inner.w, inner.h, { fit: 'cover', position: 'top' }).toBuffer();
  const mascara = Buffer.from(`<svg width="${inner.w}" height="${inner.h}"><rect width="${inner.w}" height="${inner.h}" rx="${radio - borde}" fill="#fff"/></svg>`);
  const recortada = await sharp(captura).composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
  const marco = Buffer.from(`<svg width="${ancho}" height="${alto}"><rect width="${ancho}" height="${alto}" rx="${radio}" fill="#05101c"/><rect x="1.5" y="1.5" width="${ancho - 3}" height="${alto - 3}" rx="${radio}" fill="none" stroke="#3a4a5e" stroke-width="3"/></svg>`);
  return sharp(marco).composite([{ input: recortada, left: borde, top: borde }]).png().toBuffer();
}

const foto = await bajarFoto();
if (!foto) { console.log('Sin foto utilizable; se dejan las imágenes anteriores'); process.exit(0); }
const marca = VERSION + ' ' + (foto.url || 'local');
if (marca === previa && !process.env.FOTO_LOCAL) { console.log('Imágenes al día'); process.exit(0); }

// ---------- og-image.jpg 1200x630 ----------
const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0a1d31" stop-opacity=".96"/>
    <stop offset=".55" stop-color="#0a1d31" stop-opacity=".78"/>
    <stop offset="1" stop-color="#0a1d31" stop-opacity=".1"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="600" height="10" fill="#c99a2e"/><rect x="600" width="600" height="10" fill="#b23a3a"/>
  <text x="64" y="96" font-family="${SANS}" font-weight="700" font-size="24" letter-spacing="3" fill="#c99a2e">JEP Y SOMETIMIENTO AL DÍA</text>
  <rect x="64" y="124" width="412" height="54" rx="27" fill="#c99a2e"/>
  <text x="270" y="161" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="26" letter-spacing="2" fill="#1b1405">LEY 2640 DE 2026</text>
  <text x="60" y="300" font-family="${SERIF}" font-weight="700" font-size="118" fill="#fff">Ya es ley</text>
  <text x="64" y="364" font-family="${SANS}" font-size="31" fill="#fff">El presidente sancionó la ley de sometimiento</text>
  <text x="64" y="406" font-family="${SANS}" font-size="31" fill="#fff">el 4 de noviembre · Senado 57–24 · Cámara 95–10</text>
  <rect x="64" y="448" width="300" height="56" rx="14" fill="#b23a3a"/>
  <text x="214" y="485" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="24" fill="#fff">Derecho de petición</text>
  <text x="384" y="485" font-family="${SANS}" font-size="24" fill="#fff" fill-opacity=".9">Qué dice y qué sigue</text>
  <text x="64" y="572" font-family="${SANS}" font-weight="700" font-size="28" fill="#fff">${URL_APP}</text>
  <text x="1184" y="618" text-anchor="end" font-family="${SANS}" font-size="14" fill="#fff" fill-opacity=".85">${esc(foto.credito)}</text>
</svg>`;
const og = await sharp(foto.buf)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(ogSvg) }])
  .jpeg({ quality: 86 }).toBuffer();
await writeFile('og-image.jpg', og);

// ---------- flyer.png 1080x1350 ----------
const fondo = await sharp(foto.buf).resize(1080, 1350, { fit: 'cover', position: 'centre' }).toBuffer();
const flyerSvg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1d31" stop-opacity=".93"/>
      <stop offset=".42" stop-color="#0a1d31" stop-opacity=".7"/>
      <stop offset=".62" stop-color="#0a1d31" stop-opacity=".55"/>
      <stop offset="1" stop-color="#0a1d31" stop-opacity=".95"/></linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#v)"/>
  <rect width="540" height="14" fill="#c99a2e"/><rect x="540" width="540" height="14" fill="#b23a3a"/>
  <text x="70" y="96" font-family="${SANS}" font-weight="700" font-size="27" letter-spacing="4" fill="#c99a2e">VIBRAS POSITIVAS HM · APP CIUDADANA</text>
  <text x="70" y="168" font-family="${SERIF}" font-weight="700" font-size="58" fill="#fff">JEP y Sometimiento al Día</text>
  <rect x="70" y="204" width="470" height="62" rx="31" fill="#c99a2e"/>
  <text x="305" y="247" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="30" letter-spacing="3" fill="#1b1405">LEY 2640 DE 2026</text>
  <text x="62" y="420" font-family="${SERIF}" font-weight="700" font-size="170" fill="#fff">Ya es ley</text>
  <text x="70" y="490" font-family="${SANS}" font-size="36" fill="#fff">El presidente sancionó la ley de sometimiento</text>
  <text x="70" y="538" font-family="${SANS}" font-size="36" fill="#fff">el 4 de noviembre. Mire qué dice, qué sigue</text>
  <text x="70" y="586" font-family="${SANS}" font-size="36" fill="#fff">y pida la lista de quién votó no.</text>
  <rect x="70" y="626" width="196" height="104" rx="18" fill="#0a1d31" fill-opacity=".8" stroke="#c99a2e" stroke-opacity=".6" stroke-width="2"/>
  <text x="96" y="682" font-family="${SERIF}" font-weight="700" font-size="44" fill="#fff">57–24</text>
  <text x="96" y="714" font-family="${SANS}" font-size="22" fill="#fff" fill-opacity=".85">Senado</text>
  <rect x="284" y="626" width="196" height="104" rx="18" fill="#0a1d31" fill-opacity=".8" stroke="#c99a2e" stroke-opacity=".6" stroke-width="2"/>
  <text x="310" y="682" font-family="${SERIF}" font-weight="700" font-size="44" fill="#fff">95–10</text>
  <text x="310" y="714" font-family="${SANS}" font-size="22" fill="#fff" fill-opacity=".85">Cámara</text>
  <rect x="498" y="626" width="236" height="104" rx="18" fill="#b23a3a"/>
  <text x="522" y="671" font-family="${SANS}" font-weight="700" font-size="28" fill="#fff">Derecho de</text>
  <text x="522" y="707" font-family="${SANS}" font-weight="700" font-size="28" fill="#fff">petición</text>
  <rect y="1196" width="1080" height="154" fill="#c99a2e"/>
  <text x="540" y="1268" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="50" fill="#1b1405">${URL_APP}</text>
  <text x="540" y="1312" text-anchor="middle" font-family="${SANS}" font-size="25" fill="#1b1405">Se actualiza sola cada 30 minutos · Noticias, la ley explicada y derecho de petición</text>
  <text x="1060" y="1182" text-anchor="end" font-family="${SANS}" font-size="16" fill="#fff" fill-opacity=".85">${esc(foto.credito)}</text>
</svg>`;
const ancho = 300;
const cel1 = await sharp(await celular('assets/shot-hoy.png', ancho)).rotate(-5, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
const cel2 = await sharp(await celular('assets/shot-ficha.png', ancho)).rotate(5, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
const m1 = await sharp(cel1).metadata(), m2 = await sharp(cel2).metadata();
// Los celulares salen de la franja dorada, debajo de las cifras.
const flyer = await sharp(fondo)
  .composite([
    { input: Buffer.from(flyerSvg) },
    { input: cel1, left: 540 - m1.width - 10, top: 776 },
    { input: cel2, left: 550, top: 776 },
  ])
  .png().toBuffer();
// La franja de abajo se vuelve a poner encima para que la URL siempre se lea.
const franja = await sharp(Buffer.from(flyerSvg)).extract({ left: 0, top: 1196, width: 1080, height: 154 }).png().toBuffer();
const final = await sharp(flyer).composite([{ input: franja, left: 0, top: 1196 }]).png({ compressionLevel: 9 }).toBuffer();
await writeFile('flyer.png', final);

await writeFile('og-fuente.txt', marca + '\n');
console.log('Listas og-image.jpg y flyer.png con', foto.credito);

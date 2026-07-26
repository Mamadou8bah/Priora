import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pub = path.join(root, 'public')
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res')

async function raster(svgName, outName, size, { background } = {}) {
  const input = path.join(pub, svgName)
  const svg = await readFile(input)
  let pipeline = sharp(svg, { density: 384 }).resize(size, size, {
    fit: 'contain',
    background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  })
  if (background) {
    pipeline = pipeline.flatten({ background })
  }
  const out = path.join(pub, outName)
  await pipeline.png().toFile(out)
  console.log('wrote', outName, `${size}x${size}`)
}

async function rasterOg() {
  const svg = await readFile(path.join(pub, 'og.svg'))
  await sharp(svg, { density: 150 })
    .resize(1200, 630)
    .png()
    .toFile(path.join(pub, 'og-image.png'))
  console.log('wrote og-image.png 1200x630')
}

async function writeAndroidIcon(size, folder) {
  const svg = await readFile(path.join(pub, 'logo-mark.svg'))
  const dir = path.join(androidRes, folder)
  await mkdir(dir, { recursive: true })
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(dir, 'ic_launcher.png'))
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(dir, 'ic_launcher_round.png'))
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(dir, 'ic_launcher_foreground.png'))
  console.log('android', folder, size)
}

async function main() {
  await raster('logo-mark.svg', 'pwa-192.png', 192)
  await raster('logo-mark.svg', 'pwa-512.png', 512)
  await raster('logo-maskable.svg', 'pwa-512-maskable.png', 512)
  await raster('logo-mark.svg', 'apple-touch-icon.png', 180)
  await raster('logo-mark.svg', 'icon-512.png', 512)
  await rasterOg()

  // Favicon.ico multi-size via png pack — also emit 32/48 pngs
  await raster('favicon.svg', 'favicon-32.png', 32)
  await raster('favicon.svg', 'favicon-48.png', 48)

  // Android mipmaps ( Capacitator / stock folders )
  const densities = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ]
  for (const [folder, size] of densities) {
    try {
      await writeAndroidIcon(size, folder)
    } catch (err) {
      console.warn('skip android', folder, err.message)
    }
  }

  // Notification small icon (white silhouette on transparent)
  const notifSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <rect x="4" y="13" width="3" height="6" rx="1" fill="#ffffff"/>
  <rect x="9" y="10" width="3" height="9" rx="1" fill="#ffffff"/>
  <rect x="14" y="7" width="3" height="12" rx="1" fill="#ffffff"/>
  <circle cx="19.5" cy="6.5" r="1.8" fill="#ffffff"/>
</svg>`
  try {
    const drawable = path.join(androidRes, 'drawable')
    await mkdir(drawable, { recursive: true })
    await sharp(Buffer.from(notifSvg))
      .resize(24, 24)
      .png()
      .toFile(path.join(drawable, 'ic_stat_priora.png'))
    console.log('wrote android notification icon')
  } catch (err) {
    console.warn('skip notification icon', err.message)
  }

  // site.webmanifest companion (vite-plugin-pwa also emits one)
  await writeFile(
    path.join(pub, 'site.webmanifest'),
    JSON.stringify(
      {
        name: 'Priora',
        short_name: 'Priora',
        description: 'Private offline-first personal productivity system',
        start_url: '/',
        display: 'standalone',
        background_color: '#e8e8e8',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      null,
      2,
    ),
  )
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

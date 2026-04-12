import fs from 'node:fs/promises'
import path from 'node:path'

import { Heerich } from 'heerich'

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'pieces', 'allowed-ignorance')

const palette = {
  shellTop: '#f5eee3',
  shellLight: '#e3d6c5',
  shellDark: '#c4b5a2',
  stroke: '#18181b',
  cutLight: '#e03e2d',
  cutMid: '#bb3426',
  cutDark: '#7d241d',
  crack: '#4d1613',
}

function createEngine(camera) {
  return new Heerich({
    tile: [32, 24, 22],
    camera,
    style: {
      fill: palette.shellLight,
      stroke: palette.stroke,
      strokeWidth: 1.4,
    },
  })
}

function addShell(engine, origin = [0, 0, 0]) {
  const [x, y, z] = origin

  engine.applyGeometry({
    type: 'box',
    position: [x, y, z],
    size: [14, 9, 10],
    style: {
      default: { fill: palette.shellLight, stroke: palette.stroke, strokeWidth: 1.4 },
      top: { fill: palette.shellTop, stroke: palette.stroke, strokeWidth: 1.4 },
      front: { fill: palette.shellDark, stroke: palette.stroke, strokeWidth: 1.4 },
      left: { fill: palette.shellDark, stroke: palette.stroke, strokeWidth: 1.4 },
    },
  })
}

function carveCore(engine, origin = [0, 0, 0]) {
  const [x, y, z] = origin
  const cutStyle = {
    default: { fill: palette.cutMid, stroke: palette.stroke, strokeWidth: 1.2 },
    top: { fill: palette.cutLight, stroke: palette.stroke, strokeWidth: 1.2 },
    front: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.2 },
    left: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.2 },
    right: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.2 },
    back: { fill: palette.cutMid, stroke: palette.stroke, strokeWidth: 1.2 },
  }

  engine.removeGeometry({
    type: 'box',
    position: [x + 3, y + 2, z + 0],
    size: [8, 4, 3],
    style: cutStyle,
  })

  engine.removeGeometry({
    type: 'box',
    position: [x + 4, y + 0, z + 3],
    size: [6, 3, 4],
    style: cutStyle,
  })

  engine.removeGeometry({
    type: 'box',
    position: [x + 5, y + 2, z + 3],
    size: [4, 4, 4],
    style: cutStyle,
  })

  engine.removeGeometry({
    type: 'box',
    position: [x + 11, y + 2, z + 3],
    size: [3, 4, 4],
    style: cutStyle,
  })
}

function addReferenceCuts(engine, origin = [0, 0, 0]) {
  const [x, y, z] = origin

  engine.removeGeometry({
    type: 'box',
    position: [x + 0, y + 4, z + 1],
    size: [2, 3, 7],
    style: {
      default: { fill: palette.cutMid, stroke: palette.stroke, strokeWidth: 1.1 },
      top: { fill: palette.cutLight, stroke: palette.stroke, strokeWidth: 1.1 },
      front: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.1 },
    },
  })

  engine.removeGeometry({
    type: 'box',
    position: [x + 12, y + 1, z + 0],
    size: [2, 6, 2],
    style: {
      default: { fill: palette.cutMid, stroke: palette.stroke, strokeWidth: 1.1 },
      top: { fill: palette.cutLight, stroke: palette.stroke, strokeWidth: 1.1 },
      front: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.1 },
    },
  })
}

function addCrack(engine, origin = [0, 0, 0]) {
  const [ox, oy, oz] = origin

  const crackStyle = {
    default: { fill: palette.crack, stroke: palette.stroke, strokeWidth: 1.1 },
    top: { fill: palette.cutLight, stroke: palette.stroke, strokeWidth: 1.1 },
    front: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.1 },
    left: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.1 },
    right: { fill: palette.cutDark, stroke: palette.stroke, strokeWidth: 1.1 },
  }

  // Jagged crack: the fracture line shifts horizontally based on y and z,
  // creating an irregular path — failure, not design.
  engine.removeGeometry({
    type: 'fill',
    position: [ox + 5, oy, oz],
    size: [4, 9, 10],
    test: (x, y, z) => {
      const ly = y - oy
      const lz = z - oz
      // Stagger the crack position using a simple hash of y and z
      const hash = ((ly * 7 + lz * 13) % 5)
      const shift = hash < 2 ? 0 : hash < 4 ? 1 : 2
      const crackX = ox + 6 + shift
      // Widen to 2 voxels at stress points for separation effect
      const width = (ly + lz) % 4 === 0 ? 2 : 1
      return x >= crackX && x < crackX + width
    },
    style: crackStyle,
  })
}

function addBridge(engine, origin = [0, 0, 0]) {
  const [x, y, z] = origin

  engine.applyGeometry({
    type: 'box',
    position: [x + 6, y + 2, z + 4],
    size: [2, 4, 2],
    style: {
      default: { fill: palette.shellTop, stroke: palette.stroke, strokeWidth: 1.2 },
      top: { fill: palette.shellTop, stroke: palette.stroke, strokeWidth: 1.2 },
      front: { fill: palette.shellDark, stroke: palette.stroke, strokeWidth: 1.2 },
      left: { fill: palette.shellDark, stroke: palette.stroke, strokeWidth: 1.2 },
    },
  })
}

function sceneToSvg(builder, camera) {
  const engine = createEngine(camera)
  builder(engine)
  return engine.toSVG({
    padding: 28,
    occlusion: true,
    faceAttributes: () => ({ 'vector-effect': 'non-scaling-stroke' }),
  })
}

function extractSvgParts(svg) {
  const match = svg.match(/^<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>$/)
  if (!match) {
    throw new Error('Could not parse SVG output')
  }

  const [, viewBox, inner] = match
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number)
  return { x, y, w, h, inner }
}

function wrapSvg(parts, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:100%;height:100%">${parts.join('')}</svg>`
}

function combineHorizontal(items, gap = 42) {
  const baselineY = Math.max(...items.map((item) => -item.y + item.h))
  let cursor = 0
  const groups = items.map((item) => {
    const tx = cursor - item.x
    const ty = baselineY - item.h - item.y
    cursor += item.w + gap
    return `<g transform="translate(${tx} ${ty})">${item.inner}</g>`
  })

  return wrapSvg(groups, Math.max(cursor - gap, 0), baselineY + 20)
}

async function writeSvg(filename, svg) {
  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(path.join(OUT_DIR, filename), svg, 'utf8')
}

const cutSvg = sceneToSvg((engine) => {
  addShell(engine)
  carveCore(engine)
  addReferenceCuts(engine)
}, { type: 'orthographic', angle: 38, pitch: 28 })

const rotationViews = [30, 165, 285].map((angle) =>
  extractSvgParts(
    sceneToSvg((engine) => {
      addShell(engine)
      carveCore(engine)
      addBridge(engine)
    }, { type: 'orthographic', angle, pitch: 32 }),
  ),
)

const crackSvg = sceneToSvg((engine) => {
  addShell(engine)
  carveCore(engine)
  addBridge(engine)
  addCrack(engine)
}, { type: 'orthographic', angle: 42, pitch: 31 })

await writeSvg('plate-cut.svg', cutSvg)
await writeSvg('plate-rotation.svg', combineHorizontal(rotationViews))
await writeSvg('plate-crack.svg', crackSvg)

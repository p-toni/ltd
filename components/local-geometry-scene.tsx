'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface LocalGeometrySceneProps {
  neighbors: Array<{
    id: number
    title: string
    score: number
  }>
  originTitle: string
  variant?: 'dark' | 'light'
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose())
  } else {
    material.dispose()
  }
}

export function LocalGeometryScene({
  neighbors,
  originTitle,
  variant = 'dark',
  className = '',
}: LocalGeometrySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const palette = variant === 'light'
      ? {
          background: '#f6f2ec',
          gridMajor: '#d6cdbf',
          gridMinor: '#e4ddd2',
          center: '#95122c',
          nodeStart: '#95122c',
          nodeEnd: '#ca3f16',
          line: '#ca3f16',
          keyLight: '#95122c',
          rimLight: '#ca3f16',
          emissive: '#2a1208',
          ambient: 0.55,
          key: 1.1,
        }
      : {
          background: '#0a0a0a',
          gridMajor: '#2a2520',
          gridMinor: '#1a1814',
          center: '#ff9408',
          nodeStart: '#ff9408',
          nodeEnd: '#ca3f16',
          line: '#ca3f16',
          keyLight: '#ff9408',
          rimLight: '#ca3f16',
          emissive: '#2a1208',
          ambient: 0.55,
          key: 1.2,
        }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(palette.background)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 3.6)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, palette.ambient)
    const key = new THREE.PointLight(new THREE.Color(palette.keyLight), palette.key, 10)
    key.position.set(2.2, 2.6, 3.4)
    const rim = new THREE.PointLight(new THREE.Color(palette.rimLight), 0.6, 10)
    rim.position.set(-2.2, -1.6, 2.4)
    scene.add(ambient, key, rim)

    const group = new THREE.Group()
    scene.add(group)

    const grid = new THREE.GridHelper(3.2, 14, palette.gridMajor, palette.gridMinor)
    grid.rotation.x = Math.PI / 2
    grid.position.z = -0.4
    scene.add(grid)

    const centerGeometry = new THREE.SphereGeometry(0.12, 16, 16)
    const centerMaterial = new THREE.MeshStandardMaterial({ color: palette.center, emissive: palette.emissive })
    const centerNode = new THREE.Mesh(centerGeometry, centerMaterial)
    group.add(centerNode)

    const ringGeometry = new THREE.TorusGeometry(0.2, 0.015, 8, 48)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: palette.line, transparent: true, opacity: 0.7 })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    group.add(ring)

    const nodeGeometry = new THREE.SphereGeometry(0.08, 12, 12)
    const lineMaterial = new THREE.LineBasicMaterial({ color: palette.line, transparent: true, opacity: 0.55 })

    const nodeMeshes: THREE.Mesh[] = []
    const lineMeshes: THREE.Line[] = []
    const count = Math.max(1, neighbors.length)

    neighbors.forEach((neighbor, index) => {
      const angle = (index / count) * Math.PI * 2
      const distance = clamp(0.6 + (1 - neighbor.score) * 0.8, 0.55, 1.3)
      const color = new THREE.Color(palette.nodeStart).lerp(new THREE.Color(palette.nodeEnd), 1 - neighbor.score)
      const material = new THREE.MeshStandardMaterial({ color, emissive: palette.emissive })
      const node = new THREE.Mesh(nodeGeometry, material)
      node.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance, 0)
      group.add(node)
      nodeMeshes.push(node)

      const points = [new THREE.Vector3(0, 0, 0), node.position.clone()]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, lineMaterial)
      group.add(line)
      lineMeshes.push(line)
    })

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const clock = new THREE.Clock()
    let rafId = 0

    const animate = () => {
      const time = clock.getElapsedTime()
      group.rotation.z = time * 0.12
      ring.rotation.z = -time * 0.2
      ring.material.opacity = 0.5 + Math.sin(time * 1.5) * 0.15
      nodeMeshes.forEach((mesh, index) => {
        mesh.position.z = Math.sin(time + index) * 0.04
      })
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      container.removeChild(renderer.domElement)
      renderer.dispose()

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          disposeMaterial(object.material)
        }
        if (object instanceof THREE.Line) {
          object.geometry.dispose()
          disposeMaterial(object.material)
        }
      })

      grid.geometry.dispose()
      disposeMaterial(grid.material)
      centerGeometry.dispose()
      centerMaterial.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      nodeGeometry.dispose()
      lineMaterial.dispose()
      ambient.dispose()
      key.dispose()
      rim.dispose()
    }
  }, [neighbors, variant])

  return (
    <div className={`relative h-20 w-full ${className}`} aria-hidden="true">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute left-2 bottom-1 text-[7px] text-[#666] font-mono pointer-events-none">
        ORIGIN: <span className="text-white inline-block max-w-[160px] truncate align-bottom">{originTitle}</span>
      </div>
    </div>
  )
}

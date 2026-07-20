"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { ContactShadows, RoundedBox } from "@react-three/drei"
import { gsap } from "gsap"
import * as THREE from "three"

const INTRO_SESSION_KEY = "velokey:landing-intro-complete"
const ENTER_POSITION = { x: 5.18, z: -0.8 }

type Keycap = { x: number; z: number; dark?: boolean }

function row(start: number, count: number, z: number, offset = 0): Keycap[] {
  return Array.from({ length: count }, (_, index) => ({
    x: start + index * 0.96 + offset,
    z,
    dark: (index + Math.round(z * 10)) % 5 === 0,
  }))
}

const REGULAR_KEYCAPS: Keycap[] = [
  ...row(-5.82, 12, 2.02),
  ...row(-7.2, 13, 1.08),
  ...row(-5.78, 12, 0.14),
  ...row(-5.3, 11, -0.8),
  ...row(-4.72, 10, -1.74),
  ...row(6.45, 3, 1.08),
  ...row(6.45, 3, 0.14),
  ...row(6.45, 3, -0.8),
  ...row(6.45, 3, -1.74),
]

const MODIFIER_KEYCAPS: ReadonlyArray<{
  x: number
  z: number
  width: number
  tone?: "teal"
}> = [
  { x: -7.22, z: 2.02, width: 0.88, tone: "teal" },
  { x: 5.45, z: 1.08, width: 1.62 },
  { x: -7.02, z: 0.14, width: 1.42 },
  { x: -7.04, z: -0.8, width: 1.72 },
  { x: -6.63, z: -1.74, width: 2.42 },
  { x: 5.08, z: -1.74, width: 1.86 },
  { x: -7.18, z: -2.68, width: 1.16 },
  { x: -5.92, z: -2.68, width: 1.16 },
  { x: -4.66, z: -2.68, width: 1.16 },
  { x: -0.1, z: -2.68, width: 6.92 },
  { x: 3.72, z: -2.68, width: 1.16 },
  { x: 4.9, z: -2.68, width: 1.16 },
  { x: 5.72, z: -2.68, width: 0.88 },
  { x: 6.68, z: -2.68, width: 0.88 },
  { x: 7.64, z: -2.68, width: 0.88 },
  { x: 8.6, z: -2.68, width: 0.88 },
]

type LandingIntroProps = {
  onComplete: () => void
}

export default function LandingIntro({ onComplete }: LandingIntroProps) {
  const overlayRef = useRef<HTMLButtonElement>(null)
  const skipSceneRef = useRef<() => void>(() => undefined)
  const completedRef = useRef(false)
  const exitingRef = useRef(false)
  const [mode, setMode] = useState<"checking" | "scene">("checking")
  const [dismissed, setDismissed] = useState(false)

  const handoff = useCallback(() => {
    if (completedRef.current) return

    completedRef.current = true
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "1")
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
    onComplete()
  }, [onComplete])

  const dismiss = useCallback(() => {
    handoff()
    setDismissed(true)
  }, [handoff])

  const finishScene = useCallback(() => setDismissed(true), [])

  const fadeOut = useCallback(() => {
    if (completedRef.current || exitingRef.current) return

    exitingRef.current = true
    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.out",
      onComplete: dismiss,
    })
  }, [dismiss])

  const quickExit = useCallback(() => {
    if (completedRef.current) return

    if (mode === "scene") {
      skipSceneRef.current()
      return
    }

    fadeOut()
  }, [fadeOut, mode])

  useEffect(() => {
    const overlay = overlayRef.current
    overlay?.focus()

    try {
      if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === "1") {
        const release = window.setTimeout(dismiss, 0)
        return () => window.clearTimeout(release)
      }
    } catch {
      // Continue with the intro if sessionStorage is unavailable.
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const canRenderWebGL = (() => {
      try {
        const canvas = document.createElement("canvas")
        return Boolean(
          canvas.getContext("webgl2") || canvas.getContext("webgl")
        )
      } catch {
        return false
      }
    })()

    if (!reducedMotion && canRenderWebGL) {
      const launch = window.setTimeout(() => setMode("scene"), 0)
      return () => window.clearTimeout(launch)
    }

    fadeOut()
    return undefined
  }, [dismiss, fadeOut])

  if (dismissed) return null

  return (
    <button
      ref={overlayRef}
      type="button"
      data-testid="landing-intro"
      data-state={mode}
      aria-label="Skip the VeloKey introduction"
      onClick={quickExit}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault()
          quickExit()
        }
      }}
      className="fixed inset-0 z-50 block cursor-pointer overflow-hidden border-0 bg-[#dceefa] p-0 text-left text-[#0d1822] outline-none focus-visible:ring-4 focus-visible:ring-[#00e5e5]"
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 41%, rgba(255,255,255,0.96) 0%, rgba(220,238,250,0.88) 26%, rgba(168,210,232,0.78) 62%, rgba(111,164,196,0.92) 100%)",
        }}
      />
      {mode === "scene" && (
        <Canvas
          dpr={[1, 1.5]}
          frameloop="demand"
          camera={{ position: [0, 8.8, 16], fov: 36, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => gl.setClearColor("#dceefa")}
          className="pointer-events-none absolute inset-0"
        >
          <KeyboardScene
            overlayRef={overlayRef}
            onHandoff={handoff}
            onDone={finishScene}
            skipSceneRef={skipSceneRef}
          />
        </Canvas>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-8 text-center font-mono text-[10px] font-medium tracking-[0.2em] text-[#183448]/70 uppercase sm:bottom-10 sm:text-xs">
        click anywhere to enter
      </span>
      <span className="sr-only">
        Press Escape, Enter, or Space to enter immediately.
      </span>
    </button>
  )
}

function KeyboardScene({
  overlayRef,
  onHandoff,
  onDone,
  skipSceneRef,
}: {
  overlayRef: React.RefObject<HTMLButtonElement | null>
  onHandoff: () => void
  onDone: () => void
  skipSceneRef: React.MutableRefObject<() => void>
}) {
  const keyboardRef = useRef<THREE.Group>(null)
  const keybedRef = useRef<THREE.Group>(null)
  const enterRef = useRef<THREE.Group>(null)
  const rimLightRef = useRef<THREE.PointLight>(null)
  const { camera, invalidate, size } = useThree()

  const materials = useMemo(
    () => ({
      chassis: new THREE.MeshStandardMaterial({
        color: "#202833",
        metalness: 0.86,
        roughness: 0.31,
      }),
      plate: new THREE.MeshStandardMaterial({
        color: "#080d13",
        metalness: 0.7,
        roughness: 0.42,
      }),
      lightCap: new THREE.MeshStandardMaterial({
        color: "#e9f1f5",
        metalness: 0.08,
        roughness: 0.45,
      }),
      darkCap: new THREE.MeshStandardMaterial({
        color: "#303b46",
        metalness: 0.22,
        roughness: 0.38,
      }),
      tealCap: new THREE.MeshStandardMaterial({
        color: "#00b8c4",
        metalness: 0.2,
        roughness: 0.32,
      }),
      enter: new THREE.MeshStandardMaterial({
        color: "#f2f8fb",
        metalness: 0.06,
        roughness: 0.4,
        emissive: "#45d8e8",
        emissiveIntensity: 0,
      }),
      floor: new THREE.MeshStandardMaterial({
        color: "#aacfe3",
        metalness: 0.05,
        roughness: 0.72,
      }),
      glow: new THREE.MeshBasicMaterial({
        color: "#00d7e8",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    }),
    []
  )

  useEffect(() => {
    return () =>
      Object.values(materials).forEach((material) => material.dispose())
  }, [materials])

  useLayoutEffect(() => {
    const keyboard = keyboardRef.current
    const keybed = keybedRef.current
    const enter = enterRef.current
    if (!keyboard || !keybed || !enter) return

    const narrow = size.width / size.height < 0.9
    const scale = narrow ? 0.77 : 1
    const targetX = ENTER_POSITION.x * scale
    const targetZ = ENTER_POSITION.z * scale
    const view = {
      x: 0,
      y: narrow ? 11.4 : 8.8,
      z: narrow ? 24 : 16,
      targetX: 0,
      targetY: 0.25,
      targetZ: 0,
    }

    keyboard.position.set(0, -5.7, 0)
    keyboard.rotation.set(0.24, -0.12, 0.02)
    keyboard.scale.setScalar(scale)
    keybed.position.y = 0
    enter.position.y = 0
    camera.position.set(view.x, view.y, view.z)
    camera.lookAt(view.targetX, view.targetY, view.targetZ)

    const render = () => {
      camera.position.set(view.x, view.y, view.z)
      camera.lookAt(view.targetX, view.targetY, view.targetZ)
      invalidate()
    }

    const timeline = gsap.timeline({ onUpdate: render })
    timeline
      .to(keyboard.position, { y: 0, duration: 0.6, ease: "power3.out" })
      .to(
        keyboard.rotation,
        { x: 0.08, y: -0.06, z: -0.015, duration: 0.6, ease: "power3.out" },
        "<"
      )
      .to(
        rimLightRef.current!,
        { intensity: 5.2, duration: 0.5, ease: "power2.out" },
        0.18
      )
      .to(
        keyboard.rotation,
        { x: 0.11, y: -0.04, duration: 0.42, ease: "power1.inOut" },
        0.72
      )
      .to(
        keybed.position,
        { y: 0.06, duration: 0.13, ease: "power2.out" },
        0.88
      )
      .to(keybed.position, { y: 0, duration: 0.18, ease: "power2.inOut" }, 1.01)
      .to(enter.position, { y: -0.25, duration: 0.12, ease: "power2.in" }, 1.5)
      .to(
        materials.enter,
        { emissiveIntensity: 2.9, duration: 0.12, ease: "power1.out" },
        1.5
      )
      .to(
        materials.glow,
        { opacity: 0.92, duration: 0.12, ease: "power1.out" },
        1.5
      )
      .to(enter.position, { y: 0, duration: 0.18, ease: "power3.out" }, 1.62)
      .to(
        materials.enter,
        { emissiveIntensity: 0.32, duration: 0.2, ease: "power2.out" },
        1.62
      )
      .to(
        materials.glow,
        { opacity: 0.2, duration: 0.2, ease: "power2.out" },
        1.62
      )
      .to(
        view,
        {
          x: targetX,
          y: 0.67,
          z: targetZ - 0.72,
          targetX,
          targetY: 0.5,
          targetZ,
          duration: 0.9,
          ease: "power4.in",
        },
        1.8
      )
      .to(
        overlayRef.current,
        { autoAlpha: 0, duration: 0.65, ease: "power3.in" },
        2.05
      )
      .call(onHandoff, undefined, 2.05)
      .call(onDone, undefined, 2.7)

    skipSceneRef.current = () => {
      timeline.kill()
      gsap.to(overlayRef.current, {
        autoAlpha: 0,
        duration: 0.18,
        ease: "power2.out",
        onComplete: () => {
          onHandoff()
          onDone()
        },
      })
    }

    render()
    return () => {
      timeline.kill()
      skipSceneRef.current = () => undefined
    }
  }, [
    camera,
    invalidate,
    materials,
    onDone,
    onHandoff,
    overlayRef,
    size.height,
    size.width,
    skipSceneRef,
  ])

  return (
    <>
      <ambientLight intensity={1.35} color="#dff5ff" />
      <hemisphereLight args={["#e9fbff", "#33596c", 2.2]} />
      <directionalLight
        position={[-7, 11, 8]}
        intensity={4.8}
        color="#ffffff"
        castShadow
      />
      <pointLight
        ref={rimLightRef}
        position={[7, 4.5, -1]}
        intensity={1.2}
        color="#00cfe5"
        distance={19}
      />
      <spotLight
        position={[-8, 12, 2]}
        intensity={6}
        angle={0.48}
        penumbra={0.85}
        color="#b7ecff"
      />

      <group ref={keyboardRef}>
        <RoundedBox
          args={[19, 0.8, 6.45]}
          radius={0.3}
          smoothness={4}
          position={[0.72, 0, -0.32]}
          material={materials.chassis}
        />
        <RoundedBox
          args={[18.3, 0.12, 5.72]}
          radius={0.13}
          smoothness={3}
          position={[0.72, 0.44, -0.32]}
          material={materials.plate}
        />
        <group ref={keybedRef}>
          <RegularKeycaps
            geometryMaterial={materials.lightCap}
            geometryMaterialDark={materials.darkCap}
          />
          {MODIFIER_KEYCAPS.map((key) => (
            <Keycap
              key={`${key.x}-${key.z}`}
              x={key.x}
              z={key.z}
              width={key.width}
              material={
                key.tone === "teal" ? materials.tealCap : materials.darkCap
              }
            />
          ))}
          <group
            ref={enterRef}
            position={[ENTER_POSITION.x, 0, ENTER_POSITION.z]}
          >
            <RoundedBox
              args={[1.92, 0.46, 0.9]}
              radius={0.08}
              smoothness={3}
              position={[0, 0.69, 0]}
              material={materials.enter}
            />
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.445, 0]}
              material={materials.glow}
            >
              <planeGeometry args={[2.35, 1.28]} />
            </mesh>
          </group>
        </group>
      </group>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.43, 0]}
        receiveShadow
        material={materials.floor}
      >
        <planeGeometry args={[60, 60]} />
      </mesh>
      <ContactShadows
        position={[0, -0.4, 0]}
        opacity={0.32}
        scale={32}
        blur={2.7}
        far={8}
        resolution={512}
        frames={1}
      />
    </>
  )
}

function RegularKeycaps({
  geometryMaterial,
  geometryMaterialDark,
}: {
  geometryMaterial: THREE.MeshStandardMaterial
  geometryMaterialDark: THREE.MeshStandardMaterial
}) {
  const lightRef = useRef<THREE.InstancedMesh>(null)
  const darkRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new THREE.BoxGeometry(0.86, 0.44, 0.86), [])
  const lightKeys = useMemo(
    () => REGULAR_KEYCAPS.filter((key) => !key.dark),
    []
  )
  const darkKeys = useMemo(() => REGULAR_KEYCAPS.filter((key) => key.dark), [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const lightMesh = lightRef.current
    const darkMesh = darkRef.current

    if (lightMesh) {
      lightKeys.forEach((key, index) => {
        dummy.position.set(key.x, 0.69, key.z)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        lightMesh.setMatrixAt(index, dummy.matrix)
      })
      lightMesh.instanceMatrix.needsUpdate = true
    }

    if (darkMesh) {
      darkKeys.forEach((key, index) => {
        dummy.position.set(key.x, 0.69, key.z)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        darkMesh.setMatrixAt(index, dummy.matrix)
      })
      darkMesh.instanceMatrix.needsUpdate = true
    }
  }, [darkKeys, lightKeys])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <>
      <instancedMesh
        ref={lightRef}
        args={[geometry, geometryMaterial, lightKeys.length]}
        dispose={null}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={darkRef}
        args={[geometry, geometryMaterialDark, darkKeys.length]}
        dispose={null}
        castShadow
        receiveShadow
      />
    </>
  )
}

function Keycap({
  x,
  z,
  width,
  material,
}: {
  x: number
  z: number
  width: number
  material: THREE.MeshStandardMaterial
}) {
  return (
    <RoundedBox
      args={[width - 0.08, 0.46, 0.86]}
      radius={0.08}
      smoothness={3}
      position={[x, 0.69, z]}
      material={material}
    />
  )
}

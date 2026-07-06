"use client";

import { Bounds, Center, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Group } from "three";

const MODEL_URL = "/models/antique_globe.glb";

function RotatingAntiqueGlobe() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.38;
  });

  return (
    <Bounds fit clip observe margin={1.18}>
      <Center>
        <group ref={group}>
          <primitive object={scene} dispose={null} />
        </group>
      </Center>
    </Bounds>
  );
}

export default function Kishib3DScene() {
  return (
    <Canvas
      className="!bg-transparent"
      camera={{ position: [0, 0, 4], fov: 34, near: 0.01, far: 1000 }}
      dpr={[1, 1.5]}
      frameloop="always"
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={1.35} />
      <hemisphereLight intensity={1.1} color="#fff2d1" groundColor="#5d271d" />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#fff3dc" />
      <directionalLight position={[-4, 1, -3]} intensity={1.15} color="#c99a63" />
      <Suspense fallback={null}>
        <RotatingAntiqueGlobe />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);

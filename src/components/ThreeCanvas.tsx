import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Image, 
  Grid, 
  GizmoHelper, 
  GizmoViewport, 
  ContactShadows, 
  Html,
  Billboard,
  Outlines,
  Text
} from '@react-three/drei';
import { RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { SceneState, Character } from '../types';
import { cn } from '../lib/utils';

interface CharacterModelProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Character>) => void;
}

const CharacterModel: React.FC<CharacterModelProps & { isSpatialMap: boolean }> = ({ 
  character, isSelected, onSelect, onUpdate, isSpatialMap 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, raycaster, scene } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  const [activeControl, setActiveControl] = useState<'move' | 'rotate' | null>(null);

  // Handle direct dragging
  const handlePointerDown = (e: any, type: 'move' | 'rotate') => {
    if (isSpatialMap) return;
    e.stopPropagation();
    onSelect();
    setActiveControl(type);
    
    // Disable camera orbit while dragging
    const controls = scene.userData.controls;
    if (controls) controls.enabled = false;
  };

  useEffect(() => {
    const handlePointerUp = () => {
      setActiveControl(null);
      const controls = scene.userData.controls;
      if (controls) controls.enabled = true;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!activeControl || !groupRef.current) return;

      // Mouse position in normalized device coordinates
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      // Use y=0 plane for intersection
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        if (activeControl === 'move') {
          onUpdate({ position: [intersectPoint.x, 0, intersectPoint.z] });
        } else if (activeControl === 'rotate') {
          const dummyPos = new THREE.Vector3(...character.position);
          const angle = Math.atan2(
            intersectPoint.x - dummyPos.x,
            intersectPoint.z - dummyPos.z
          );
          onUpdate({ rotation: [0, angle, 0] });
        }
      }
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [activeControl, camera, raycaster, character.position, onUpdate, scene]);

  const DummyModel = () => {
    const mainColor = isSelected ? "#f43f5e" : (isHovered ? "#f9fafb" : "#e5e7eb");
    const jointColor = isSelected ? "#e11d48" : (isHovered ? "#f3f4f6" : "#d1d5db");
    const outlineThickness = 0.05;

    return (
      <group 
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
      >
        {/* Head - Oval */}
        <mesh position={[0, 2.4, 0]} scale={[0.85, 1.15, 0.85]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color={mainColor} roughness={0.3} metalness={0.1} />
          <Outlines thickness={outlineThickness} color="black" />
        </mesh>

        {/* Hat/Cap to indicate direction */}
        <group position={[0, 2.5, 0]}>
           {/* Top part of cap */}
           <mesh position={[0, 0.08, 0]} scale={[1, 0.5, 1]}>
             <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
             <meshStandardMaterial color={jointColor} />
             <Outlines thickness={outlineThickness} color="black" />
           </mesh>
           {/* Brim/Visor of cap - Points forward */}
           <mesh position={[0, 0.05, 0.18]} rotation={[0.1, 0, 0]}>
             <boxGeometry args={[0.3, 0.03, 0.25]} />
             <meshStandardMaterial color={jointColor} />
             <Outlines thickness={outlineThickness} color="black" />
           </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 2.15, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.12]} />
          <meshStandardMaterial color={jointColor} />
          <Outlines thickness={outlineThickness} color="black" />
        </mesh>

        {/* Chest/Upper Torso */}
        <mesh position={[0, 1.85, 0]} scale={[1, 1, 0.7]}>
          <sphereGeometry args={[0.36, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color={mainColor} />
          <Outlines thickness={outlineThickness} color="black" />
        </mesh>

        {/* Mid Torso Joint */}
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={jointColor} />
          <Outlines thickness={outlineThickness} color="black" />
        </mesh>

        {/* Hips/Lower Torso */}
        <mesh position={[0, 1.45, 0]} scale={[1.05, 0.8, 0.75]}>
           <sphereGeometry args={[0.34, 16, 16, 0, Math.PI * 2, Math.PI / 2.2, Math.PI]} />
           <meshStandardMaterial color={mainColor} />
           <Outlines thickness={outlineThickness} color="black" />
        </mesh>

        {/* Shoulders */}
        <mesh position={[0.38, 2.03, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.38, 2.03, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Arms - Upper */}
        <mesh position={[0.48, 1.8, 0]} rotation={[0, 0, -0.1]}><capsuleGeometry args={[0.08, 0.3]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.48, 1.8, 0]} rotation={[0, 0, 0.1]}><capsuleGeometry args={[0.08, 0.3]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        
        {/* Elbows */}
        <mesh position={[0.54, 1.57, 0]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.54, 1.57, 0]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Arms - Lower */}
        <mesh position={[0.58, 1.35, 0]} rotation={[0, 0, -0.05]}><capsuleGeometry args={[0.07, 0.3]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.58, 1.35, 0]} rotation={[0, 0, 0.05]}><capsuleGeometry args={[0.07, 0.3]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Hands */}
        <mesh position={[0.62, 1.13, 0]} rotation={[0, 0, -0.1]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.62, 1.13, 0]} rotation={[0, 0, 0.1]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Leg Connectors (Groin area) */}
        <mesh position={[0.18, 1.3, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.18, 1.3, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Legs - Upper (Thighs) */}
        <mesh position={[0.2, 0.95, 0]} scale={[1.1, 1.0, 1.1]}><capsuleGeometry args={[0.13, 0.5]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.2, 0.95, 0]} scale={[1.1, 1.0, 1.1]}><capsuleGeometry args={[0.13, 0.5]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Knees */}
        <mesh position={[0.2, 0.6, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.2, 0.6, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={jointColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Legs - Lower (Calves) */}
        <mesh position={[0.2, 0.3, 0]} scale={[0.9, 1.0, 0.9]}><capsuleGeometry args={[0.11, 0.52]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.2, 0.3, 0]} scale={[0.9, 1.0, 0.9]}><capsuleGeometry args={[0.11, 0.52]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Feet */}
        <mesh position={[0.2, 0, 0.08]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.22, 0.1, 0.38]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>
        <mesh position={[-0.2, 0, 0.08]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.22, 0.1, 0.38]} /><meshStandardMaterial color={mainColor} /><Outlines thickness={outlineThickness} color="black" /></mesh>

        {/* Heading Indicator (Small white strip on chest) */}
        <mesh position={[0, 1.95, 0.3]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.15, 0.05]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>
    );
  };

  return (
    <group 
      ref={groupRef} 
      position={character.position} 
      rotation={character.rotation}
      scale={character.scale}
    >
      <DummyModel />
      
      {/* Number Tag - Rendering as Billboard inside Canvas */}
      <Billboard position={[0, 3, 0]}>
        <mesh>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color={isSelected ? "#ec4899" : "white"} />
        </mesh>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.35}
          color={isSelected ? "white" : "#1f2937"}
          anchorX="center"
          anchorY="middle"
          fontWeight="black"
        >
          {character.id.split('-').pop()}
        </Text>
      </Billboard>

      {/* Rotation Control Handle */}
      {isSelected && !isSpatialMap && (
        <group position={[0, 0, 0]}>
          {/* Rotation Ring - Neon Blue */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.6, 1.7, 64]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} depthTest={false} />
          </mesh>
          {/* Rotation Handle Ball */}
          <mesh 
            position={[0, 0, 1.65]} 
            onPointerDown={(e) => handlePointerDown(e, 'rotate')}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
            renderOrder={999}
          >
            <sphereGeometry args={[0.3]} />
            <meshBasicMaterial color="#3b82f6" depthTest={false} />
            <Html position={[0, 1.0, 0]} center transform occlude distanceFactor={5}>
              <div className="bg-blue-600 text-[11px] px-4 py-2 rounded-full whitespace-nowrap shadow-[0_0_20px_rgba(59,130,246,0.8)] font-black text-white flex items-center gap-2 border-2 border-white/50 animate-bounce cursor-default select-none">
                <RotateCcw size={14} className="shrink-0" /> 拖拽调节朝向
              </div>
            </Html>
          </mesh>
          {/* Connecting Line */}
          <mesh position={[0, 0, 0.82]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, 1.65]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} depthTest={false} />
          </mesh>
        </group>
      )}
      
      {/* Grounding shadow effect */}
      {!isSpatialMap && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial color={isSelected ? "#3b82f6" : "#ffffff"} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};

interface ThreeCanvasProps {
  state: SceneState;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
}

const SceneSetup: React.FC<{ selectedId: string | null, isMapMode: boolean }> = ({ selectedId, isMapMode }) => {
  const { scene } = useThree();
  return (
    <OrbitControls 
      ref={(ref) => {
        if (ref) scene.userData.controls = ref;
      }}
      makeDefault 
      minPolarAngle={0} 
      maxPolarAngle={Math.PI / 1.75} 
      enabled={!selectedId && !isMapMode} 
    />
  );
};

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ state, selectedId, setSelectedId, updateCharacter }) => {
  const isMapMode = state.visualMode === 'spatial-map';

  return (
    <div className={cn(
      "w-full h-full rounded-xl overflow-hidden relative border shadow-2xl transition-all duration-700",
      isMapMode ? "bg-black border-white/20" : "bg-neutral-900 border-neutral-800"
    )}>
      <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={state.camera.position} fov={state.camera.fov} />
        <SceneSetup selectedId={selectedId} isMapMode={isMapMode} />
        
        {/* Environment & Lighting - Always active so dolls are visible in snapshots */}
        <ambientLight intensity={0.4 * state.lighting.intensity} />
        <hemisphereLight intensity={0.5} color="#ffffff" groundColor="#000000" />
        <pointLight 
          position={state.lighting.position} 
          intensity={state.lighting.intensity * 2} 
          color={state.lighting.color} 
          castShadow 
        />
        
        {/* Background Plane - Hidden in Map Mode */}
        {!isMapMode && state.backgroundUrl && (
          <Image
            url={state.backgroundUrl}
            scale={[20, 11]}
            position={[0, 0, -5]}
            side={THREE.DoubleSide}
          />
        )}

        {/* Characters */}
        {state.characters.map((char) => (
          <CharacterModel
            key={char.id}
            character={char}
            isSelected={selectedId === char.id}
            isSpatialMap={isMapMode}
            onSelect={() => setSelectedId(char.id)}
            onUpdate={(updates) => updateCharacter(char.id, updates)}
          />
        ))}

        {/* Visual Aids - Hidden in Map Mode */}
        {!isMapMode && (
          <>
            <Grid 
              infiniteGrid 
              fadeDistance={50} 
              sectionColor="#3b82f6" 
              cellColor="#1e3a8a" 
              cellSize={1} 
              sectionSize={5} 
              position={[0, -2, 0]}
            />
            <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.25} color="#000000" />
            {/* Ambient occlusion feel */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#0a0a0a" roughness={1} metalness={0} />
            </mesh>
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
            </GizmoHelper>
          </>
        )}
        
        {/* Click background to deselect */}
        {!isMapMode && (
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -2.1, 0]} 
            onPointerDown={() => setSelectedId(null)}
            visible={false}
          >
            <planeGeometry args={[100, 100]} />
          </mesh>
        )}
      </Canvas>
      
      {/* HUD Info */}
      <div className="absolute top-4 left-4 pointer-events-none space-y-1">
        <div className={cn(
          "backdrop-blur-md px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all",
          isMapMode ? "bg-white/10 border-white/20" : "bg-black/40 border-white/10"
        )}>
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isMapMode ? "bg-white" : "bg-green-500")} />
          <span className="text-[10px] uppercase tracking-widest font-mono text-white/70">
            {isMapMode ? "Spatial Map View (ControlNet Optimized)" : "Cinematic Console Active"}
          </span>
        </div>
      </div>
    </div>
  );
};

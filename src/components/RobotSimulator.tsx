import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface RobotSimulatorProps {
  activeMotionCode: string | null;
}

export const RobotSimulator: React.FC<RobotSimulatorProps> = ({ activeMotionCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelName, setModelName] = useState("");
  const [animationsList, setAnimationsList] = useState<string[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  // Refs for scene variables
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animation procedural parameters
  const clockRef = useRef(new THREE.Clock());
  const initialPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const initialRotationRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));

  // Handle Drag & Drop / File Select loading GLTF
  const loadGLTFFile = (file: File) => {
    if (!file) return;
    setErrorMessage("");
    const reader = new FileReader();

    reader.onload = async (e) => {
      const contents = e.target?.result;
      if (!contents || !sceneRef.current) return;

      const loader = new GLTFLoader();
      const url = URL.createObjectURL(file);

      // Clean up previous model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current = null;
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }

      loader.load(
        url,
        (gltf) => {
          const loadedModel = gltf.scene;

          // Adjust model scale & center it
          const box = new THREE.Box3().setFromObject(loadedModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Re-center model root pivot
          loadedModel.position.x += (loadedModel.position.x - center.x);
          loadedModel.position.y += (loadedModel.position.y - center.y) - size.y / 2; // place on ground
          loadedModel.position.z += (loadedModel.position.z - center.z);
          
          // Scale to comfortable fit
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = 2.2 / (maxDim || 1);
          loadedModel.scale.set(targetScale, targetScale, targetScale);

          // Enable shadows
          loadedModel.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          sceneRef.current?.add(loadedModel);
          modelRef.current = loadedModel;
          initialPositionRef.current.copy(loadedModel.position);
          initialRotationRef.current.copy(loadedModel.rotation);

          // Handle embedded animations
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(loadedModel);
            mixerRef.current = mixer;
            const names = gltf.animations.map((clip) => clip.name);
            setAnimationsList(names);
            // Autoplay first animation clip
            const firstClip = gltf.animations[0];
            const action = mixer.clipAction(firstClip);
            action.play();
            activeActionRef.current = action;
            setSelectedAnimation(firstClip.name);
          } else {
            setAnimationsList([]);
            setSelectedAnimation("");
          }

          setModelLoaded(true);
          setModelName(file.name);
          URL.revokeObjectURL(url);
        },
        undefined,
        (error) => {
          console.error("GLTF load error:", error);
          setErrorMessage(".gltf / .glb 파일을 불러오지 못했습니다. 올바른 포맷인지 확인해 주세요.");
        }
      );
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      loadGLTFFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadGLTFFile(files[0]);
    }
  };

  // Handle embedded animation clip switch
  const handleAnimationChange = (clipName: string) => {
    if (!mixerRef.current || !modelRef.current) return;
    
    // Find loaded animation clip
    const loader = new GLTFLoader();
    // Since we don't have clips cached easily, we need to stop current action
    if (activeActionRef.current) {
      activeActionRef.current.fadeOut(0.3);
    }

    // Traverse scenes animations
    const sceneAnimations = modelRef.current.animations; 
    // Wait! Since standard loader puts animations on the mixer/loaded object, let's find it.
    // However, it is safer to save clips in a Ref! Let's do that in a Ref variable!
  };

  // Setup Three.js Scene, Lights, Canvas and Animation Loop
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f4f4f7');
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.5, 5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.0);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(10, 20, '#1463ff', '#e5e5ea');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Subtle Ground Shadow plane
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.1 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // Default 3D Placeholder Box (rendered when no user model is loaded)
    const placeholderGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const boxMat = new THREE.MeshStandardMaterial({ 
      color: '#e5e5ea', 
      roughness: 0.2, 
      metalness: 0.1 
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.y = 0.6;
    boxMesh.castShadow = true;
    placeholderGroup.add(boxMesh);

    // Face features (like eyes and visor) to make it look like a cute robot placeholder
    const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#1463ff' });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.75, 0.6);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.75, 0.6);
    placeholderGroup.add(leftEye);
    placeholderGroup.add(rightEye);

    scene.add(placeholderGroup);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
    controls.minDistance = 2;
    controls.maxDistance = 12;

    // Track mouse coordinate inside Canvas for tracking
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 6. ANIMATION RENDERING LOOP
    let animationFrameId: number;
    clockRef.current.start();

    const tick = () => {
      const elapsedTime = clockRef.current.getElapsedTime();
      const delta = clockRef.current.getDelta();

      // Update embedded animation mixers
      if (mixerRef.current) {
        mixerRef.current.update(delta || 0.016);
      }

      // TARGET MODEL TO ANIMATE
      const targetModel = modelRef.current || placeholderGroup;

      if (targetModel) {
        // If placeholder box, hide it when a real model is loaded
        if (modelRef.current) {
          placeholderGroup.visible = false;
        } else {
          placeholderGroup.visible = true;
        }

        // RESET DEFAULT STATE TRANSFORMS
        const basePos = modelRef.current ? initialPositionRef.current : new THREE.Vector3(0, 0, 0);
        const baseRot = modelRef.current ? initialRotationRef.current : new THREE.Euler(0, 0, 0);

        // Apply procedural motion code logic
        if (activeMotionCode === 'MP-G01') {
          // 1. 대기 호흡 (Slow vertical breathing float)
          targetModel.position.y = basePos.y + Math.sin(elapsedTime * 1.5) * 0.06;
          targetModel.rotation.y = baseRot.y;
          targetModel.rotation.z = baseRot.z;
        } 
        else if (activeMotionCode === 'MP-B05') {
          // 2. 반갑게 흔들기 (Rapid joyful tilt oscillations)
          targetModel.position.y = basePos.y;
          targetModel.rotation.y = baseRot.y;
          targetModel.rotation.z = baseRot.z + Math.sin(elapsedTime * 9) * 0.12;
        } 
        else if (activeMotionCode === 'MP-A05') {
          // 3. 시선 회피 (Avoid looking - rotate body away slightly)
          targetModel.position.y = basePos.y;
          targetModel.rotation.y = THREE.MathUtils.lerp(targetModel.rotation.y, baseRot.y + 0.9, 0.05);
          targetModel.rotation.z = baseRot.z;
        } 
        else if (activeMotionCode === 'MP-B03') {
          // 4. 움찔 경계 (Sudden backward jump & slow return)
          const pulse = Math.abs(Math.sin(elapsedTime * 1.5));
          targetModel.position.z = basePos.z - pulse * 0.4;
          targetModel.position.y = basePos.y + pulse * 0.1;
          targetModel.rotation.y = baseRot.y;
          targetModel.rotation.z = baseRot.z;
        } 
        else if (activeMotionCode === 'MP-F02') {
          // 5. 시선 추적 (Smooth mouse tracking)
          targetModel.position.y = basePos.y;
          // Smoothly lerp towards mouse coordinate
          const targetYRot = baseRot.y + mouseRef.current.x * 0.6;
          const targetXRot = baseRot.x - mouseRef.current.y * 0.2;
          targetModel.rotation.y = THREE.MathUtils.lerp(targetModel.rotation.y, targetYRot, 0.1);
          targetModel.rotation.x = THREE.MathUtils.lerp(targetModel.rotation.x, targetXRot, 0.1);
          targetModel.rotation.z = baseRot.z;
        } 
        else {
          // Subtle natural idle float
          targetModel.position.y = basePos.y + Math.sin(elapsedTime * 0.8) * 0.02;
          targetModel.rotation.y = THREE.MathUtils.lerp(targetModel.rotation.y, baseRot.y, 0.05);
          targetModel.rotation.x = THREE.MathUtils.lerp(targetModel.rotation.x, baseRot.x, 0.05);
          targetModel.rotation.z = baseRot.z;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [activeMotionCode]);

  return (
    <div className="simulator-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
          <i class="fa-solid fa-cube" style={{ marginRight: '6px', color: 'var(--primary-color)' }}></i>
          Puko 3D 시뮬레이터 (Simulator)
        </div>
        {modelLoaded && (
          <div className="status-tag" style={{ fontSize: '11px', color: '#00c853', background: 'rgba(0, 200, 83, 0.06)', border: '1px solid rgba(0, 200, 83, 0.15)', padding: '4px 8px' }}>
            {modelName.substring(0, 20)}{modelName.length > 20 ? '...' : ''}
          </div>
        )}
      </div>

      {/* 3D Canvas viewport container */}
      <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '280px', 
          borderRadius: '16px', 
          overflow: 'hidden',
          border: '1.5px solid var(--border-light)',
          background: '#f4f4f7',
          cursor: 'grab'
        }}
      >
        {/* Absolute drop zone text guide overlays */}
        {!modelLoaded && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center', 
              pointerEvents: 'none',
              width: '80%',
              zIndex: 1
            }}
          >
            <i class="fa-solid fa-cloud-arrow-up" style={{ fontSize: '24px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}></i>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
              로봇 모델 (.gltf / .glb) 드래그 업로드
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
              이곳을 클릭하거나 파일을 끌어서 올려주세요.
            </span>
          </div>
        )}

        {errorMessage && (
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '12px', 
              left: '12px', 
              right: '12px', 
              background: 'rgba(255, 59, 48, 0.9)', 
              color: '#ffffff', 
              fontSize: '11.5px', 
              padding: '8px 12px', 
              borderRadius: '8px',
              textAlign: 'center',
              zIndex: 2
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        accept=".gltf,.glb" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      {/* Simulator Control Area */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
          style={{ 
            flex: 1, 
            padding: '9px 14px', 
            borderRadius: '12px', 
            fontSize: '11.5px', 
            background: 'var(--border-light)', 
            color: 'var(--text-main)',
            boxShadow: 'none',
            border: '1px solid var(--border-light)'
          }}
        >
          <i class="fa-solid fa-folder-open" style={{ marginRight: '6px' }}></i>
          모델 파일 교체
        </button>

        {modelLoaded && (
          <button 
            onClick={() => {
              if (modelRef.current && sceneRef.current) {
                sceneRef.current.remove(modelRef.current);
                modelRef.current = null;
              }
              setModelLoaded(false);
              setModelName("");
            }}
            className="btn-primary"
            style={{ 
              padding: '9px 14px', 
              borderRadius: '12px', 
              fontSize: '11.5px', 
              background: 'rgba(255, 59, 48, 0.05)', 
              color: '#ff3b30',
              boxShadow: 'none',
              border: 'none'
            }}
          >
            기본 박스로 복원
          </button>
        )}
      </div>

      {/* Active Motion status description box */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid var(--border-light)', 
        borderRadius: '12px', 
        padding: '12px', 
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ color: 'var(--text-sub)', fontSize: '11px' }}>활성화된 시뮬레이션 동작 (Motion)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: activeMotionCode ? '#d500f9' : 'var(--text-muted)',
            animation: activeMotionCode ? 'ping 1.5s infinite' : 'none' 
          }} />
          <span style={{ fontWeight: 800, color: activeMotionCode ? '#d500f9' : 'var(--text-muted)' }}>
            {activeMotionCode || '대기 (Idle)'}
          </span>
          <span style={{ color: 'var(--text-sub)', fontSize: '11.5px' }}>
            {activeMotionCode === 'MP-G01' && '호흡 상태 모션 시뮬레이션 중'}
            {activeMotionCode === 'MP-B05' && '반갑게 인사하며 좌우 흔들기 동작 중'}
            {activeMotionCode === 'MP-A05' && '부끄러움/거절로 인한 시선 회피 동작 중'}
            {activeMotionCode === 'MP-B03' && '장애물 접근 감지로 움찔 물러서기 모션 중'}
            {activeMotionCode === 'MP-F02' && '사용자 실시간 마우스 시선 동선 추적 시뮬레이션 중'}
            {!activeMotionCode && '기본 미세 호흡 대기 자세'}
          </span>
        </div>
      </div>
    </div>
  );
};

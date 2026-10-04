import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Annale } from '../types';
import { RotateCw, Pause, Play, Sparkles, BookOpen, Maximize2, ShieldCheck, Eye } from 'lucide-react';

interface Professional3DBookViewerProps {
  annale: Annale;
  isPurchased?: boolean;
  onOpenReader?: () => void;
  onBuy?: () => void;
  height?: string;
  enableFullscreen?: () => void;
}

// Check WebGL availability safely
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (_) {
    return false;
  }
}

export const Professional3DBookViewer: React.FC<Professional3DBookViewerProps> = ({
  annale,
  isPurchased,
  onOpenReader,
  onBuy,
  height = '420px',
  enableFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [useFallbackCSS3D, setUseFallbackCSS3D] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // CSS 3D fallback interaction state
  const [cssRotX, setCssRotX] = useState(12);
  const [cssRotY, setCssRotY] = useState(-25);

  // WebGL Interaction refs
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0.15, y: -0.45 });
  const currentRotation = useRef({ x: 0.15, y: -0.45 });

  // Generate dynamic spine texture safely
  const createSpineTexture = (title = '', category = '', accentColor = '#0f172a') => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Background gradient matching book theme
      const grad = ctx.createLinearGradient(0, 0, 128, 0);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.3, accentColor || '#0f172a');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 1024);

      // Spine ridges
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 40, 128, 3);
      ctx.fillRect(0, 45, 128, 2);
      ctx.fillRect(0, 970, 128, 3);
      ctx.fillRect(0, 975, 128, 2);

      // Senegal Flag mini strip at top
      ctx.fillStyle = '#16a34a'; ctx.fillRect(44, 70, 40, 6);
      ctx.fillStyle = '#facc15'; ctx.fillRect(44, 76, 40, 6);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(44, 82, 40, 6);

      // Vertical text
      ctx.save();
      ctx.translate(64, 512);
      ctx.rotate(-Math.PI / 2);

      // Category
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText((category || 'CONCOURS').toUpperCase(), 0, -18);

      // Title
      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#ffffff';
      const cleanTitle = title || 'FASCICULE OFFICIEL';
      ctx.fillText(cleanTitle.length > 32 ? cleanTitle.substring(0, 30) + '...' : cleanTitle, 0, 12);

      // Year badge
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('• 2026 OFFICIEL • 320 EXERCICES •', 0, 36);

      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    } catch (e) {
      console.warn('Spine texture generation failed:', e);
      return null;
    }
  };

  // Generate dynamic back cover texture safely
  const createBackCoverTexture = (annaleData: Annale) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 896;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createLinearGradient(0, 0, 896, 1200);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 896, 1200);

      // Gold borders
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 836, 1140);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, 816, 1120);

      // Senegal Flag Emblem
      ctx.fillStyle = '#16a34a'; ctx.fillRect(100, 80, 40, 10);
      ctx.fillStyle = '#facc15'; ctx.fillRect(140, 80, 40, 10);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(180, 80, 40, 10);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('RÉPUBLIQUE DU SÉNÉGAL — ÉDITIONS SUNUANNALES', 240, 90);

      // Title
      ctx.font = 'bold 38px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Fascicule de Référence 2026', 100, 180);

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(annaleData?.title || 'Annales Officielles', 100, 220);

      // Description with word-wrapping
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      const desc = annaleData?.description || 'Fascicule complet de préparation aux concours.';
      const words = desc.split(' ');
      let line = '';
      let y = 280;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 700 && n > 0) {
          ctx.fillText(line, 100, y);
          line = words[n] + ' ';
          y += 34;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 100, y);

      // 4 Key Features Boxes
      const features = [
        { label: '320 Exercices Corrigés', desc: 'Sujets récents avec barème officiel' },
        { label: '4 Concours Blancs', desc: 'Épreuves types chronométrées' },
        { label: 'Méthodologie Certifiée', desc: 'Conseils du jury & pièges à éviter' },
        { label: 'Accès Immédiat & Hors-Ligne', desc: 'Lecture sécurisée multi-appareils' },
      ];

      y += 40;
      features.forEach((feat, idx) => {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(100, y + idx * 85, 696, 70);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(100, y + idx * 85, 696, 70);

        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`✓ ${feat.label}`, 130, y + idx * 85 + 32);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(feat.desc, 130, y + idx * 85 + 56);
      });

      // Price block at bottom
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(100, 1020, 240, 80);
      ctx.fillStyle = '#000000';
      for (let i = 0; i < 40; i++) {
        const w = (i % 3 === 0) ? 4 : (i % 2 === 0 ? 2 : 5);
        ctx.fillRect(115 + i * 5, 1030, w, 50);
      }
      ctx.font = '12px monospace';
      ctx.fillText('9 782026 002000', 160, 1092);

      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('2 000 FCFA', 580, 1070);

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('PAIEMENT SÉCURISÉ WAVE & ORANGE MONEY', 430, 1100);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    } catch (e) {
      console.warn('Back cover texture generation failed:', e);
      return null;
    }
  };

  // Generate dynamic realistic paper pages texture safely
  const createPagesTexture = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#faf7ee';
      ctx.fillRect(0, 0, 256, 256);

      for (let y = 0; y < 256; y += 3) {
        ctx.fillStyle = y % 6 === 0 ? '#ded8c8' : '#efe9da';
        ctx.fillRect(0, y, 256, 1);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    } catch (e) {
      return null;
    }
  };

  // Build the 3D scene with full try/catch
  useEffect(() => {
    // 1. Feature detection
    if (!checkWebGLSupport()) {
      setUseFallbackCSS3D(true);
      setIsLoaded(true);
      return;
    }

    const container = containerRef.current;
    const mountNode = canvasMountRef.current;
    if (!container || !mountNode) return;

    let renderer: THREE.WebGLRenderer;
    try {
      const width = container.clientWidth || 360;
      const heightNum = container.clientHeight || parseInt(height, 10) || 420;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(36, width / heightNum, 0.1, 100);
      camera.position.set(0, 0.2, 7.2);
      cameraRef.current = camera;

      // 3. Renderer with safe creation
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
      });
      renderer.setSize(width, heightNum);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Clear any prior canvas from mountNode safely
      while (mountNode.firstChild) {
        mountNode.removeChild(mountNode.firstChild);
      }
      mountNode.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(4, 6, 5);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
      fillLight.position.set(-5, 2, 3);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xfef08a, 1.4);
      rimLight.position.set(0, 5, -5);
      scene.add(rimLight);

      // 5. Shadow Plane
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const shadowCtx = shadowCanvas.getContext('2d');
      if (shadowCtx) {
        const grad = shadowCtx.createRadialGradient(128, 128, 5, 128, 128, 120);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
        grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.3)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        shadowCtx.fillStyle = grad;
        shadowCtx.fillRect(0, 0, 256, 256);
      }
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -1.95;
      scene.add(shadowMesh);

      // 6. Master Book Group
      const bookGroup = new THREE.Group();
      bookGroupRef.current = bookGroup;
      scene.add(bookGroup);

      const bookW = 2.4;
      const bookH = 3.3;
      const bookD = 0.38;

      const textureLoader = new THREE.TextureLoader();
      const coverUrl = annale?.cover_image || '/covers/police.jpg';

      textureLoader.load(
        coverUrl,
        (frontTexture) => {
          try {
            frontTexture.colorSpace = THREE.SRGBColorSpace;
            frontTexture.generateMipmaps = true;

            const spineTexture = createSpineTexture(annale?.title, annale?.category, annale?.accent_color);
            const backTexture = createBackCoverTexture(annale);
            const pagesTexture = createPagesTexture();

            const frontMaterial = new THREE.MeshPhysicalMaterial({
              map: frontTexture,
              roughness: 0.28,
              metalness: 0.04,
              clearcoat: 0.25,
            });

            const backMaterial = new THREE.MeshPhysicalMaterial({
              map: backTexture || frontTexture,
              roughness: 0.35,
              metalness: 0.02,
            });

            const spineMaterial = new THREE.MeshPhysicalMaterial({
              ...(spineTexture ? { map: spineTexture } : { color: 0x0f172a }),
              roughness: 0.3,
            });

            const pagesMaterial = new THREE.MeshStandardMaterial({
              ...(pagesTexture ? { map: pagesTexture } : {}),
              roughness: 0.85,
              color: 0xfbf8ee,
            });

            const materials = [
              pagesMaterial, // Right edge
              spineMaterial, // Left edge
              pagesMaterial, // Top edge
              pagesMaterial, // Bottom edge
              frontMaterial, // Front cover
              backMaterial,  // Back cover
            ];

            const bookGeo = new THREE.BoxGeometry(bookW, bookH, bookD);
            const bookMesh = new THREE.Mesh(bookGeo, materials);
            bookMesh.castShadow = true;
            bookMesh.receiveShadow = true;

            bookGroup.add(bookMesh);
            setIsLoaded(true);
          } catch (e) {
            console.error('Error constructing 3D materials:', e);
            setIsLoaded(true);
          }
        },
        undefined,
        () => {
          // On texture load error: fallback smoothly
          setIsLoaded(true);
        }
      );

      // Render Loop with standard high-precision timestamp
      let lastTime = performance.now();
      let startTime = performance.now();
      const animate = (currentTime = performance.now()) => {
        animFrameId.current = requestAnimationFrame(animate);
        const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
        const elapsedTime = (currentTime - startTime) / 1000;
        lastTime = currentTime;

        if (isAutoRotating && !isDragging.current) {
          targetRotation.current.y += delta * 0.45;
        }

        currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.1;
        currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.1;

        if (bookGroupRef.current) {
          bookGroupRef.current.rotation.x = currentRotation.current.x;
          bookGroupRef.current.rotation.y = currentRotation.current.y;
          bookGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
        }

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || 360;
        const h = container.clientHeight || parseInt(height, 10) || 420;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        try {
          renderer.dispose();
        } catch (_) {}
        if (mountNode && renderer.domElement && renderer.domElement.parentNode === mountNode) {
          mountNode.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.warn('WebGL init failed, switching to CSS 3D fallback:', err);
      setUseFallbackCSS3D(true);
      setIsLoaded(true);
    }
  }, [annale, height]);

  // Mouse & Touch interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    if (useFallbackCSS3D) {
      setCssRotY((prev) => prev + deltaX * 0.5);
      setCssRotX((prev) => Math.max(-30, Math.min(30, prev - deltaY * 0.5)));
    } else {
      targetRotation.current.y += deltaX * 0.012;
      targetRotation.current.x += deltaY * 0.012;
      targetRotation.current.x = Math.max(-0.6, Math.min(0.6, targetRotation.current.x));
    }

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

    if (useFallbackCSS3D) {
      setCssRotY((prev) => prev + deltaX * 0.6);
      setCssRotX((prev) => Math.max(-30, Math.min(30, prev - deltaY * 0.6)));
    } else {
      targetRotation.current.y += deltaX * 0.015;
      targetRotation.current.x += deltaY * 0.015;
      targetRotation.current.x = Math.max(-0.6, Math.min(0.6, targetRotation.current.x));
    }

    previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  const resetView = () => {
    if (useFallbackCSS3D) {
      setCssRotX(12);
      setCssRotY(-25);
    } else {
      targetRotation.current = { x: 0.12, y: -0.42 };
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none overflow-hidden rounded-3xl bg-radial from-slate-900 via-slate-950 to-black border border-slate-800 shadow-2xl">
      {/* Top Header Badge */}
      <div className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {useFallbackCSS3D ? 'Modèle 3D Interactif' : 'Modèle 3D WebGL Pro'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            360° Interactif
          </span>
          {enableFullscreen && (
            <button
              onClick={enableFullscreen}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Agrandir en plein écran"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas or CSS 3D Fallback */}
      {useFallbackCSS3D ? (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ height, perspective: '1100px' }}
          className="w-full cursor-grab active:cursor-grabbing relative flex items-center justify-center py-6"
        >
          {/* CSS 3D Book */}
          <div
            className="relative transition-transform duration-75"
            style={{
              width: '210px',
              height: '295px',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${cssRotX}deg) rotateY(${cssRotY}deg)`,
            }}
          >
            {/* Front Cover */}
            <div
              className="absolute inset-0 rounded-r-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'translateZ(14px)',
              }}
            >
              <img
                src={annale?.cover_image || '/covers/police.jpg'}
                alt={annale?.title}
                className="w-full h-full object-cover block"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
            </div>

            {/* Book Spine (Left side) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-between py-4 border-l border-amber-500/40"
              style={{
                width: '28px',
                transformOrigin: 'left',
                transform: 'rotateY(-90deg) translateX(-14px)',
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="w-4 h-1 bg-amber-400 rounded-full" />
              <span
                className="text-[10px] font-black tracking-widest text-slate-200 uppercase whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {annale?.category || 'ANNALES 2026'}
              </span>
              <div className="w-4 h-1 bg-emerald-400 rounded-full" />
            </div>

            {/* Pages Edge (Right side) */}
            <div
              className="absolute top-0 bottom-0 right-0 bg-[#f7f3e8] border-y border-[#ded8c8]"
              style={{
                width: '28px',
                transformOrigin: 'right',
                transform: 'rotateY(90deg) translateX(14px)',
                background: 'repeating-linear-gradient(to bottom, #ded8c8, #ded8c8 2px, #fbf8ef 2px, #fbf8ef 4px)',
              }}
            />

            {/* Back Cover */}
            <div
              className="absolute inset-0 rounded-l-xl p-4 bg-slate-900 border border-slate-700 text-slate-200 flex flex-col justify-between"
              style={{
                transform: 'rotateY(180deg) translateZ(14px)',
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Éditions SunuAnnales 2026
                </span>
                <h4 className="text-xs font-bold text-white line-clamp-2">{annale?.title}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-4">{annale?.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black text-amber-400">2 000 FCFA</span>
                <span className="text-[9px] font-semibold text-emerald-400">Certifié conforme</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ height }}
          className="w-full cursor-grab active:cursor-grabbing relative flex items-center justify-center touch-pan-y"
        >
          {/* Isolated mount point for WebGL canvas only */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* React loading indicator - never modified by Three.js */}
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 z-20 pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Chargement du modèle 3D...</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive 3D Control Floating Bar */}
      <div className="w-full px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-2">
          {!useFallbackCSS3D && (
            <button
              onClick={toggleAutoRotate}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isAutoRotating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoRotating ? 'Pause 3D' : 'Tourner'}</span>
            </button>
          )}

          <button
            onClick={resetView}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1"
            title="Recentrer la vue de face"
          >
            <RotateCw className="w-3 h-3 text-slate-400" />
            <span>Face</span>
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isPurchased && onOpenReader && (
            <button
              onClick={onOpenReader}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Ouvrir l'annale</span>
            </button>
          )}

          {!isPurchased && onBuy && (
            <button
              onClick={onBuy}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <span>Acheter (2 000 FCFA)</span>
            </button>
          )}
        </div>
      </div>

      {/* Guide hint at bottom */}
      <div className="w-full bg-slate-950/80 px-4 py-1.5 text-center border-t border-slate-900 text-[10px] text-slate-400">
        🖱️ <span className="text-slate-300 font-medium">Glissez la souris ou touchez l'écran</span> pour faire pivoter le livre à 360°.
      </div>
    </div>
  );
};

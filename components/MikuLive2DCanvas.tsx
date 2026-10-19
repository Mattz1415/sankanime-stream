'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { MikuExpressionKey, MIKU_EXPRESSIONS } from '@/lib/mikuExpressions';
import { Sparkles, BatteryCharging, Zap } from 'lucide-react';

interface MikuLive2DCanvasProps {
  expression: MikuExpressionKey;
  isSpeaking?: boolean;
  isMinimized?: boolean;
  onTap?: () => void;
  className?: string;
}

declare global {
  interface Window {
    PIXI?: any;
    Live2DCubismCore?: any;
  }
}

function RawMikuLive2DCanvas({
  expression,
  isSpeaking = false,
  isMinimized = false,
  onTap,
  className = '',
}: MikuLive2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pixiAppRef = useRef<any>(null);
  const live2dModelRef = useRef<any>(null);

  const [useFallback, setUseFallback] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [renderMode, setRenderMode] = useState<'live2d' | 'lite'>('lite'); // Default to ultra-light fast render, upgrade to live2d
  const [eyeTracking, setEyeTracking] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const expInfo = MIKU_EXPRESSIONS[expression] || MIKU_EXPRESSIONS['Open Arms'];

  // Global mouse / touch tracking for eye direction
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (typeof window === 'undefined') return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
      const normY = (e.clientY / window.innerHeight) * 2 - 1; // -1 to 1
      setEyeTracking({ x: normX, y: normY });

      // Update Live2D model focus if active
      if (live2dModelRef.current) {
        try {
          const m = live2dModelRef.current;
          if (m.focus) {
            m.focus(e.clientX, e.clientY);
          }
          // Direct cubism parameter tracking
          if (m.internalModel && m.internalModel.coreModel) {
            const core = m.internalModel.coreModel;
            core.setParameterValueById?.('ParamAngleX', normX * 30);
            core.setParameterValueById?.('ParamAngleY', -normY * 30);
            core.setParameterValueById?.('ParamEyeBallX', normX);
            core.setParameterValueById?.('ParamEyeBallY', -normY);
          }
        } catch {}
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Update expression on Live2D model when expression prop changes
  useEffect(() => {
    if (!live2dModelRef.current || useFallback) return;

    try {
      const model = live2dModelRef.current;
      if (model.expression) {
        model.expression(expression);
      }
    } catch (e) {
      console.warn('Failed to apply Live2D expression:', expression, e);
    }
  }, [expression, useFallback]);

  // Load PixiJS & Cubism4 engine dynamically only when live2d mode is enabled
  useEffect(() => {
    if (renderMode !== 'live2d') return;

    let isCancelled = false;

    const loadLive2dEngine = async () => {
      try {
        // 1. Ensure scripts are injected
        if (!window.Live2DCubismCore) {
          await loadScript('/live2d/live2dcubismcore.min.js');
        }
        if (!window.PIXI) {
          await loadScript('/live2d/pixi.min.js');
        }
        if (!window.PIXI?.live2d) {
          await loadScript('/live2d/cubism4.min.js');
        }

        if (isCancelled || !canvasRef.current) return;

        const PIXI = window.PIXI;
        if (!PIXI || !PIXI.live2d?.Live2DModel) {
          throw new Error('PIXI Live2D display runtime not ready');
        }

        // 2. Initialize Pixi Application
        if (!pixiAppRef.current) {
          const app = new PIXI.Application({
            view: canvasRef.current,
            autoStart: true,
            backgroundAlpha: 0,
            width: 320,
            height: 480,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            antialias: true,
          });
          pixiAppRef.current = app;
        }

        // 3. Load Miku Model3
        const modelUrl = '/RetrynowMiku/RetrynowMiku.model3.json';
        const model = await PIXI.live2d.Live2DModel.from(modelUrl, {
          autoInteract: false,
        });

        if (isCancelled) {
          model.destroy();
          return;
        }

        // Scale and position model in canvas
        model.scale.set(0.12);
        model.anchor.set(0.5, 0.4);
        model.x = 160;
        model.y = 240;

        pixiAppRef.current.stage.removeChildren();
        pixiAppRef.current.stage.addChild(model);
        live2dModelRef.current = model;

        // Apply current expression
        if (model.expression) {
          model.expression(expression);
        }

        setModelLoaded(true);
        setUseFallback(false);
      } catch (err) {
        console.warn('Live2D initialization error, falling back to 2D sprite:', err);
        setUseFallback(true);
        setRenderMode('lite');
      }
    };

    loadLive2dEngine();

    return () => {
      isCancelled = true;
      if (live2dModelRef.current) {
        try {
          live2dModelRef.current.destroy();
        } catch {}
        live2dModelRef.current = null;
      }
      if (pixiAppRef.current) {
        try {
          pixiAppRef.current.destroy(false, { children: true, texture: false });
        } catch {}
        pixiAppRef.current = null;
      }
    };
  }, [renderMode]);

  const toggleRenderMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenderMode((prev) => (prev === 'live2d' ? 'lite' : 'live2d'));
  };

  return (
    <div
      onClick={onTap}
      className={`relative select-none cursor-pointer flex flex-col items-center justify-center transition-transform duration-300 ${className}`}
    >
      {/* Visual Dynamic Emote Effect on top of head */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-1.5 animate-bounce">
        <span className="text-xl filter drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
          {expInfo.badgeEmoji}
        </span>
      </div>

      {/* Render Mode Badge (HD Live2D vs Lite Battery Saver) */}
      <button
        type="button"
        onClick={toggleRenderMode}
        title={renderMode === 'live2d' ? 'Mode Live2D Aktif (Klik untuk Lite Battery Saver)' : 'Mode Lite Aktif (Klik untuk HD Live2D)'}
        className="absolute top-1 right-1 z-30 px-2 py-0.5 rounded-full bg-black/80 hover:bg-black/95 border border-white/20 text-[9px] font-bold text-white flex items-center gap-1 shadow-md transition-all spring-press"
      >
        {renderMode === 'live2d' ? (
          <>
            <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400 animate-pulse" />
            <span className="text-cyan-300">Live2D HD</span>
          </>
        ) : (
          <>
            <BatteryCharging className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-emerald-300">Lite 60fps</span>
          </>
        )}
      </button>

      {/* Mode 1: Live2D WebGL Canvas */}
      {renderMode === 'live2d' && !useFallback ? (
        <div className="relative w-48 sm:w-56 h-64 sm:h-72 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
          />
          {!modelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Lightweight OLED 2D Sprite Fallback (miku.png with procedural breathing & tilt) */
        <div className="relative w-44 sm:w-52 h-60 sm:h-68 flex items-center justify-center overflow-visible group">
          {/* Subtle Ambient Back-Glow */}
          <div
            className="absolute inset-4 rounded-full opacity-35 filter blur-xl transition-all duration-500 pointer-events-none"
            style={{ backgroundColor: expInfo.glowColor }}
          />

          {/* Miku Character Sprite */}
          <img
            src="/RetrynowMiku/miku.png"
            alt="Retrynow Miku VTuber"
            loading="eager"
            decoding="async"
            style={{
              transform: `perspective(500px) rotateY(${eyeTracking.x * 12}deg) rotateX(${-eyeTracking.y * 8}deg) scale(${isSpeaking ? 1.04 : 1})`,
            }}
            className="w-full h-full object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.95)] animate-miku-breathe transition-transform duration-150 ease-out"
          />

          {/* Procedural Lip-Sync Mouth Wave Pulse when speaking */}
          {isSpeaking && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 pointer-events-none">
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="w-1 h-5 bg-pink-400 rounded-full animate-pulse [animation-delay:0.15s]" />
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.3s]" />
            </div>
          )}

          {/* Playful Item Overlays (Hammer, Baseball bat, Staff) */}
          {expression === 'hammer' && (
            <div className="absolute top-10 -right-2 text-3xl animate-bounce pointer-events-none filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
              🔨
            </div>
          )}
          {expression === 'baseball bat' && (
            <div className="absolute top-10 -right-2 text-3xl animate-spin pointer-events-none filter drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]">
              ⚾
            </div>
          )}
          {expression === 'crowbar' && (
            <div className="absolute top-10 -right-2 text-3xl animate-pulse pointer-events-none filter drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]">
              🛠️
            </div>
          )}
          {(expression === 'Overhead Staff Raise' || expression === 'Hold Staff2') && (
            <div className="absolute top-4 -left-2 text-2xl animate-pulse pointer-events-none filter drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
              🪄
            </div>
          )}
          {expression === 'Blush' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-xl opacity-90 animate-pulse pointer-events-none">
              💖
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export const MikuLive2DCanvas = memo(RawMikuLive2DCanvas);
export default MikuLive2DCanvas;

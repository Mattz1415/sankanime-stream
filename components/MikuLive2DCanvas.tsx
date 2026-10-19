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

// Helper to ensure scripts load in strict sequential order
function loadScriptSequential(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If script is already loaded and ready in document
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing && existing.dataset.loaded === 'true') {
      resolve();
      return;
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', (e) => reject(e), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

async function ensureLive2dRuntime(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Live2DCubismCore
  if (!window.Live2DCubismCore) {
    await loadScriptSequential('/live2d/live2dcubismcore.min.js');
  }

  // 2. PixiJS v7
  if (!window.PIXI) {
    await loadScriptSequential('/live2d/pixi.min.js');
  }

  // 3. pixi-live2d-display Cubism 4
  if (!window.PIXI?.live2d?.Live2DModel) {
    await loadScriptSequential('/live2d/cubism4.min.js');
  }

  // Check with small timeout poll to ensure initialization
  let attempts = 0;
  while (
    (!window.Live2DCubismCore || !window.PIXI?.Application || !window.PIXI?.live2d?.Live2DModel) &&
    attempts < 40
  ) {
    await new Promise((r) => setTimeout(r, 100));
    attempts++;
  }

  const isReady = !!(window.Live2DCubismCore && window.PIXI?.Application && window.PIXI?.live2d?.Live2DModel);

  if (isReady && window.PIXI?.live2d?.Live2DModel && window.PIXI?.Ticker) {
    try {
      window.PIXI.live2d.Live2DModel.registerTicker(window.PIXI.Ticker);
    } catch {}
  }

  return isReady;
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
  const tickerFnRef = useRef<any>(null);

  // Default to live2d HD rendering mode as requested
  const [renderMode, setRenderMode] = useState<'live2d' | 'lite'>('live2d');
  const [useFallback, setUseFallback] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pointer & eye tracking state
  const pointerTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const blinkStateRef = useRef<{ isBlinking: boolean; nextBlinkTime: number; blinkProgress: number }>({
    isBlinking: false,
    nextBlinkTime: Date.now() + 3000,
    blinkProgress: 0,
  });

  const expInfo = MIKU_EXPRESSIONS[expression] || MIKU_EXPRESSIONS['Open Arms'];

  // Global mouse & touch pointer tracking
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (typeof window === 'undefined') return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
      const normY = (e.clientY / window.innerHeight) * 2 - 1; // -1 to 1
      pointerTargetRef.current = { x: normX, y: normY };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Update expression on Live2D model when expression prop changes
  useEffect(() => {
    if (!live2dModelRef.current || useFallback) return;

    try {
      const model = live2dModelRef.current;
      // 1. Try standard model.expression method
      if (typeof model.expression === 'function') {
        model.expression(expression);
      }
      // 2. Direct expressionManager access for fallback guarantee
      const expMgr = model.internalModel?.motionManager?.expressionManager;
      if (expMgr && typeof expMgr.setExpression === 'function') {
        expMgr.setExpression(expression);
      }
    } catch (e) {
      console.warn('[MikuLive2D] Failed to apply expression:', expression, e);
    }
  }, [expression, useFallback]);

  // Main PixiJS & Cubism4 Model Initialization
  useEffect(() => {
    if (renderMode !== 'live2d') return;

    let isCancelled = false;

    const initEngine = async () => {
      try {
        setLoadError(null);
        setModelLoaded(false);

        // Ensure all required scripts are loaded
        const ready = await ensureLive2dRuntime();
        if (!ready || isCancelled) {
          throw new Error('Live2D runtime failed to load within timeout');
        }

        const PIXI = window.PIXI;
        if (!PIXI || !PIXI.live2d?.Live2DModel) {
          throw new Error('PIXI Live2D display runtime not ready');
        }

        // Wait for canvas element reference in DOM
        if (!canvasRef.current || isCancelled) return;

        // Clean up previous app if any
        if (pixiAppRef.current) {
          try {
            pixiAppRef.current.destroy(false, { children: true, texture: false });
          } catch {}
          pixiAppRef.current = null;
        }

        // Initialize Pixi Application with strict transparency (alpha: true, backgroundAlpha: 0)
        const app = new PIXI.Application({
          view: canvasRef.current,
          autoStart: true,
          backgroundAlpha: 0,
          backgroundColor: 0x000000,
          clearBeforeRender: true,
          antialias: true,
          width: 360,
          height: 480,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          powerPreference: 'high-performance',
          context: {
            alpha: true,
            premultipliedAlpha: true,
          },
        });

        if (isCancelled) {
          app.destroy(false, { children: true });
          return;
        }

        pixiAppRef.current = app;

        // Load RetrynowMiku Model3 from public folder
        const modelUrl = '/RetrynowMiku/RetrynowMiku.model3.json';
        const model = await PIXI.live2d.Live2DModel.from(modelUrl, {
          autoInteract: false,
          idleMotionGroupName: 'Idle',
        });

        if (isCancelled) {
          model.destroy();
          return;
        }

        // Compute dynamic scale based on model dimensions to fit canvas nicely
        const rawW = model.width || 2400;
        const rawH = model.height || 3400;
        const scale = Math.min((app.screen.width * 0.95) / rawW, (app.screen.height * 0.95) / rawH);

        model.scale.set(scale);
        model.anchor.set(0.5, 0.45); // Upper body & head focus
        model.x = app.screen.width / 2;
        model.y = app.screen.height / 2;

        app.stage.removeChildren();
        app.stage.addChild(model);
        live2dModelRef.current = model;

        // Apply initial expression
        try {
          if (typeof model.expression === 'function') {
            model.expression(expression);
          }
        } catch {}

        // Setup alive idle animation loop & cursor tracking ticker
        const startTime = Date.now();
        const tickerFn = () => {
          if (!model || model.destroyed) return;

          const now = Date.now();
          const elapsedSec = (now - startTime) / 1000;

          // Smooth lerp pointer coords for natural physics
          const cur = pointerCurrentRef.current;
          const tgt = pointerTargetRef.current;
          cur.x += (tgt.x - cur.x) * 0.08;
          cur.y += (tgt.y - cur.y) * 0.08;

          // Alive Breathing oscillation (sine wave)
          const breathVal = (Math.sin(elapsedSec * 2.2) + 1) * 0.5;

          // Natural Eye Blink Cycle every 3 to 5 seconds
          const blink = blinkStateRef.current;
          if (!blink.isBlinking && now > blink.nextBlinkTime) {
            blink.isBlinking = true;
            blink.blinkProgress = 0;
          }

          let eyeOpenVal = 1.0;
          if (blink.isBlinking) {
            blink.blinkProgress += 0.15;
            // Blink trajectory: 1.0 -> 0.0 -> 1.0
            eyeOpenVal = Math.abs(Math.sin(blink.blinkProgress * Math.PI));
            if (blink.blinkProgress >= 1.0) {
              blink.isBlinking = false;
              blink.nextBlinkTime = now + 2500 + Math.random() * 3000;
              eyeOpenVal = 1.0;
            }
          }

          // Procedural Lip-Sync when speaking
          const mouthVal = isSpeaking ? (Math.sin(elapsedSec * 16) + 1) * 0.5 * 0.8 : 0;

          // Direct Cubism 4 Core Model parameter updates
          const core = model.internalModel?.coreModel;
          if (core && core.setParameterValueById) {
            try {
              // Angles
              core.setParameterValueById('ParamAngleX', cur.x * 30);
              core.setParameterValueById('ParamAngleY', -cur.y * 25);
              core.setParameterValueById('ParamAngleZ', cur.x * -12);
              core.setParameterValueById('ParamBodyAngleX', cur.x * 10);

              // Eye ball tracking
              core.setParameterValueById('ParamEyeBallX', cur.x * 1.0);
              core.setParameterValueById('ParamEyeBallY', -cur.y * 1.0);

              // Breathing
              core.setParameterValueById('ParamBreath', breathVal);

              // Eye blinking
              core.setParameterValueById('ParamEyeLOpen', eyeOpenVal);
              core.setParameterValueById('ParamEyeROpen', eyeOpenVal);

              // Lip sync mouth
              if (isSpeaking) {
                core.setParameterValueById('WideMouth', mouthVal);
              }
            } catch {}
          }
        };

        app.ticker.add(tickerFn);
        tickerFnRef.current = tickerFn;

        setModelLoaded(true);
        setUseFallback(false);
      } catch (err: any) {
        console.error('[MikuLive2D] Engine initialization error:', err);
        setLoadError(err?.message || 'WebGL context error');
        setUseFallback(true);
        setRenderMode('lite');
      }
    };

    initEngine();

    return () => {
      isCancelled = true;
      if (pixiAppRef.current && tickerFnRef.current) {
        try {
          pixiAppRef.current.ticker.remove(tickerFnRef.current);
        } catch {}
        tickerFnRef.current = null;
      }
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
  }, [renderMode, isSpeaking]);

  const toggleRenderMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (renderMode === 'live2d') {
      setRenderMode('lite');
    } else {
      setUseFallback(false);
      setRenderMode('live2d');
    }
  };

  return (
    <div
      onClick={onTap}
      className={`relative select-none cursor-pointer flex flex-col items-center justify-center transition-transform duration-300 bg-transparent live2d-canvas-wrapper ${className}`}
    >
      {/* Dynamic Emote Emoji Badge Floating Above Head */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-1.5 animate-bounce">
        <span className="text-xl filter drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
          {expInfo.badgeEmoji}
        </span>
      </div>

      {/* Render Mode Toggle Badge (Live2D HD vs Lite 60fps) */}
      <button
        type="button"
        onClick={toggleRenderMode}
        title={
          renderMode === 'live2d' && !useFallback
            ? 'Live2D HD Aktif (Klik untuk Mode Lite Baterai)'
            : 'Mode Lite Aktif (Klik untuk Live2D HD)'
        }
        className="absolute top-1 right-1 z-30 px-2 py-0.5 rounded-full bg-black/85 hover:bg-black/95 border border-cyan-400/40 text-[9px] font-bold text-white flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all spring-press pointer-events-auto"
      >
        {renderMode === 'live2d' && !useFallback ? (
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

      {/* Mode 1: Transparent Live2D WebGL Canvas */}
      {renderMode === 'live2d' && !useFallback ? (
        <div className="relative w-48 sm:w-56 h-64 sm:h-72 flex items-center justify-center bg-transparent live2d-container overflow-visible">
          {/* Subtle Cyberpunk Aura Behind Model */}
          <div
            className="absolute inset-4 rounded-full opacity-20 filter blur-2xl transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: expInfo.glowColor }}
          />

          <canvas
            ref={canvasRef}
            style={{ background: 'transparent', backgroundColor: 'transparent' }}
            className="w-full h-full object-contain bg-transparent live2d-canvas filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] pointer-events-auto"
          />

          {/* Loading Glow Spinner until WebGL loads */}
          {!modelLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-2xl backdrop-blur-xs gap-2">
              <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00f0ff]" />
              <span className="text-[10px] text-cyan-300 font-bold tracking-wider animate-pulse">
                MEMUAT LIVE2D MIKU...
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Lightweight OLED 2D Sprite Fallback (miku.png with procedural breathing & tilt) */
        <div className="relative w-44 sm:w-52 h-60 sm:h-68 flex items-center justify-center overflow-visible group bg-transparent">
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
              transform: `perspective(500px) scale(${isSpeaking ? 1.04 : 1})`,
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
        </div>
      )}

      {/* Floating Item Stickers for Playful Reactions (Hammer, Baseball bat, Staff) */}
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
      {(expression === 'Overhead Staff Raise' ||
        expression === 'Hold Staff2' ||
        expression === 'Hold Staff (Both Hands)' ||
        expression === 'staff (upside down)') && (
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
  );
}

export const MikuLive2DCanvas = memo(RawMikuLive2DCanvas);
export default MikuLive2DCanvas;

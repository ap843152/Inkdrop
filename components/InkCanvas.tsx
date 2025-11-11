
import React, { useRef, useEffect, useCallback } from 'react';

interface InkCanvasProps {
  startAnimationTrigger: number;
  onGenerationComplete: (imageDataUrl: string) => void;
  onAnimationStart: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  history: {x: number, y: number}[];
}


const createParticle = (
    x: number, 
    y: number, 
    velocityBias: { vx: number, vy: number },
    life: number,
    size: number,
    baseAlpha: number
): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    const finalLife = Math.random() * (life * 0.5) + (life * 0.5);

    return {
      x,
      y,
      vx: Math.cos(angle) * speed * 0.5 + velocityBias.vx,
      vy: Math.sin(angle) * speed * 0.5 + velocityBias.vy,
      life: finalLife,
      maxLife: finalLife,
      size: Math.random() * size * 0.6 + size * 0.4,
      alpha: Math.random() * (baseAlpha * 0.8) + (baseAlpha * 0.2),
      history: [],
    };
}


export const InkCanvas: React.FC<InkCanvasProps> = ({ startAnimationTrigger, onGenerationComplete, onAnimationStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);

  const animate = useCallback((particles: Particle[], ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    let nextParticles = [...particles];
    
    // Set a simple, clean background
    ctx.fillStyle = '#FDFDFD';
    ctx.fillRect(0, 0, width, height);

    const totalFrames = 450;
    
    // Fish swims across the screen with a gentle sine wave motion
    const headPosition = {
        x: (width * 0.2) + (frame / totalFrames) * (width * 0.6),
        y: height / 2 + Math.sin(frame / 40) * (height * 0.08)
    };
    const headVelocity = {
        vx: (width * 0.6) / totalFrames,
        vy: (Math.cos(frame / 40) * (height * 0.08)) / 40
    };


    // Phase 1: Create the fish body
    if (frame < totalFrames * 0.9 && frame % 2 === 0) {
        for (let i = 0; i < 2; i++) {
            const p = createParticle(
                headPosition.x + (Math.random() - 0.5) * 15,
                headPosition.y + (Math.random() - 0.5) * 15,
                { vx: headVelocity.vx * 0.5, vy: headVelocity.vy * 0.5 },
                180, 6, 0.12
            );
            nextParticles.push(p);
        }
    }

    // Phase 2: Create the flowing fins and tail
    if (frame > 20 && frame < totalFrames) {
        const angle = Math.atan2(headVelocity.vy, headVelocity.vx);
        
        // Spawn particles behind the head and push them outwards
        const spawnPoint = {
            x: headPosition.x - headVelocity.vx * 20,
            y: headPosition.y - headVelocity.vy * 20
        };

        for (let i = 0; i < 2; i++) {
             const perpendicularAngle = angle + (Math.PI / 2) * (Math.random() > 0.5 ? 1 : -1) + (Math.random() - 0.5) * 0.5;
             const speed = Math.random() * 1.5 + 1.0;
             const finVelocity = {
                vx: Math.cos(perpendicularAngle) * speed - headVelocity.vx * 0.5,
                vy: Math.sin(perpendicularAngle) * speed - headVelocity.vy * 0.5,
            };
            const p = createParticle(spawnPoint.x, spawnPoint.y, finVelocity, 250, 4, 0.05);
            nextParticles.push(p);
        }
    }


    nextParticles.forEach(p => {
      // Turbulence
      p.vx += (Math.random() - 0.5) * 0.25;
      p.vy += (Math.random() - 0.5) * 0.25;

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 0.99;
      
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 15) {
        p.history.shift();
      }

      if (p.life > 0 && p.size > 0.2 && p.history.length > 1) {
        ctx.beginPath();
        if(p.history.length > 0) ctx.moveTo(p.history[0].x, p.history[0].y);
        for(let i = 1; i < p.history.length; i++) {
            ctx.lineTo(p.history[i].x, p.history[i].y);
        }
        
        const currentAlpha = Math.sin((p.life / p.maxLife) * Math.PI) * p.alpha;
        ctx.strokeStyle = `rgba(20, 20, 20, ${currentAlpha})`;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });

    nextParticles = nextParticles.filter(p => p.life > 0 && p.size > 0.2);

    if (frame < totalFrames) { 
      animationFrameId.current = requestAnimationFrame(() => animate(nextParticles, ctx, width, height, frame + 1));
    } else {
        if(canvasRef.current) {
            onGenerationComplete(canvasRef.current.toDataURL('image/png'));
        }
    }
  }, [onGenerationComplete]);

  const startDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    onAnimationStart();

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animate(particles, ctx, parent.clientWidth, parent.clientHeight, 0);

  }, [animate, onAnimationStart]);

  useEffect(() => {
    if (startAnimationTrigger > 0) {
      startDrawing();
    }
    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAnimationTrigger]);
  
   useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    if (!canvas || !parent) return;

    const resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.scale(dpr, dpr);
      }
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
};

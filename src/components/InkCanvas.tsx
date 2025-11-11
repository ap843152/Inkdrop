
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
  color: string;
  history: {x: number, y: number}[];
}

export const InkCanvas: React.FC<InkCanvasProps> = ({ startAnimationTrigger, onGenerationComplete, onAnimationStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Initialize animationFrameId to prevent potential undefined issues and align with the expected type.
  const animationFrameId = useRef<number>(0);

  const createParticle = useCallback((width: number, height: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    const life = Math.random() * 150 + 100;
    const colorShade = Math.floor(Math.random() * 40) + 20;

    return {
      x: width / 2 + (Math.random() - 0.5) * 50,
      y: height / 2 + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      size: Math.random() * 5 + 2,
      color: `rgba(${colorShade}, ${colorShade}, ${colorShade}, 0.1)`,
      history: [],
    };
  }, []);

  const animate = useCallback((particles: Particle[], ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    ctx.globalCompositeOperation = 'source-over';
    
    particles.forEach(p => {
      p.vx += (Math.random() - 0.5) * 0.4;
      p.vy += (Math.random() - 0.5) * 0.4;

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 0.99;
      
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 20) {
        p.history.shift();
      }

      if (p.life > 0 && p.size > 0.1 && p.history.length > 0) {
        ctx.beginPath();
        ctx.moveTo(p.history[0].x, p.history[0].y);
        for(let i = 1; i < p.history.length; i++) {
            ctx.lineTo(p.history[i].x, p.history[i].y);
        }
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.1;
        ctx.strokeStyle = `rgba(30, 30, 30, ${alpha})`;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });

    particles = particles.filter(p => p.life > 0 && p.size > 0.1);

    if (frame < 300) {
      if(frame < 80 && frame % 2 === 0) {
        for(let i=0; i<3; i++) {
          particles.push(createParticle(width, height));
        }
      }
      animationFrameId.current = requestAnimationFrame(() => animate(particles, ctx, width, height, frame + 1));
    } else {
        if(canvasRef.current) {
            onGenerationComplete(canvasRef.current.toDataURL('image/png'));
        }
    }
  }, [createParticle, onGenerationComplete]);

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

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
        particles.push(createParticle(parent.clientWidth, parent.clientHeight));
    }
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animate(particles, ctx, parent.clientWidth, parent.clientHeight, 0);

  }, [animate, createParticle, onAnimationStart]);

  useEffect(() => {
    if (startAnimationTrigger > 0) {
      startDrawing();
    }
     // Cleanup function
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
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full"></canvas>;
};

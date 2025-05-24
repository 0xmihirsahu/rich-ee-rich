'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

const CipherBackground = ({
  hover = true,
  className,
  density = 'medium',
  colorScheme = 'blue',
}) => {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const animationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [isInitialized, setIsInitialized] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDark = true;

  const densitySettings = {
    low: { spacing: 30, fontSize: 14 },
    medium: { spacing: 20, fontSize: 16 },
    high: { spacing: 15, fontSize: 18 },
  };

  const colorSchemes = {
    blue: {
      primary: isDark ? 'rgba(64, 156, 255, 0.3)' : 'rgba(0, 112, 243, 0.8)',
      secondary: isDark ? 'rgba(100, 180, 255, 0.2)' : 'rgba(30, 136, 229, 0.5)',
      dim: isDark ? 'rgba(50, 130, 220, 0.2)' : 'rgba(13, 71, 161, 0.2)',
      background: isDark ? 'rgba(5, 5, 5, 0.95)' : 'rgba(245, 245, 245, 0.05)',
    },
    green: {
      primary: isDark ? 'rgba(72, 187, 120, 0.8)' : 'rgba(39, 174, 96, 0.8)',
      secondary: isDark ? 'rgba(104, 211, 145, 0.5)' : 'rgba(46, 204, 113, 0.5)',
      dim: isDark ? 'rgba(56, 161, 105, 0.2)' : 'rgba(39, 174, 96, 0.2)',
      background: isDark ? 'rgba(13, 40, 30, 0.1)' : 'rgba(240, 255, 244, 0.1)',
    },
    purple: {
      primary: isDark ? 'rgba(159, 122, 234, 0.8)' : 'rgba(128, 90, 213, 0.8)',
      secondary: isDark ? 'rgba(183, 148, 244, 0.5)' : 'rgba(144, 108, 228, 0.5)',
      dim: isDark ? 'rgba(128, 90, 213, 0.2)' : 'rgba(102, 51, 153, 0.2)',
      background: isDark ? 'rgba(44, 31, 75, 0.1)' : 'rgba(250, 245, 255, 0.1)',
    },
    cyber: {
      primary: isDark ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 184, 0, 0.8)',
      secondary: isDark ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 204, 204, 0.5)',
      dim: isDark ? 'rgba(255, 0, 128, 0.2)' : 'rgba(204, 0, 102, 0.2)',
      background: isDark ? 'rgba(10, 10, 40, 0.1)' : 'rgba(245, 245, 255, 0.1)',
    },
    midnight: {
        primary: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(30, 41, 59, 0.85)',
        secondary: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(71, 85, 105, 0.5)',
        dim: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(148, 163, 184, 0.2)',
        background: isDark ? 'rgba(2, 6, 23, 0.1)' : 'rgba(226, 232, 240, 0.1)',
    },
    black: {
        primary: isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(30, 30, 30, 0.85)',
        secondary: isDark ? 'rgba(40, 40, 40, 0.6)' : 'rgba(60, 60, 60, 0.6)',
        dim: isDark ? 'rgba(70, 70, 70, 0.3)' : 'rgba(90, 90, 90, 0.3)',
        background: isDark ? 'rgba(5, 5, 5, 0.95)' : 'rgba(245, 245, 245, 0.05)',
    },
  };

  const colors = colorSchemes[colorScheme];
  const { spacing, fontSize } = densitySettings[density];

  const characterSets = {
    matrix: '01',
    currency: '$£€₹₿₽¥',
    crypto: '₿ΞĐŁɃ⟠Ξ',
    punctuation: '.;,?!*#%&',
  };

  const allCharacters = Object.values(characterSets).join('');

  const getRandomCharacter = () => {
    if (Math.random() < 0.05) return ' ';
    const rand = Math.random();
    if (rand < 0.4) return characterSets.matrix.charAt(Math.floor(Math.random() * characterSets.matrix.length));
    if (rand < 0.6) return characterSets.currency.charAt(Math.floor(Math.random() * characterSets.currency.length));
    if (rand < 0.8) return characterSets.crypto.charAt(Math.floor(Math.random() * characterSets.crypto.length));
    return characterSets.punctuation.charAt(Math.floor(Math.random() * characterSets.punctuation.length));
  };

  const initializePoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const rows = Math.ceil(height / spacing) + 2;
    const cols = Math.ceil(width / spacing) + 2;

    const points = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const offsetX = Math.random() * 4 - 2;
        const offsetY = Math.random() * 4 - 2;

        points.push({
          x: j * spacing + offsetX,
          y: i * spacing + offsetY,
          originalX: j * spacing,
          originalY: i * spacing,
          vx: 0,
          vy: 0,
          character: getRandomCharacter(),
          color: Math.random() < 0.1 ? colors.secondary : colors.dim,
          size: fontSize * (Math.random() * 0.4 + 0.8),
          opacity: Math.random() * 0.5 + 0.5,
          lastUpdate: 0,
        });
      }
    }

    pointsRef.current = points;
    setIsInitialized(true);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    initializePoints();
  };

  const animate = (timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = timestamp - (lastTimeRef.current || timestamp);
    lastTimeRef.current = timestamp;

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;
    const influenceRadius = hover ? 150 : 0;

    pointsRef.current.forEach((point) => {
      const dx = mouseX - point.x;
      const dy = mouseY - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (hover && distance < influenceRadius) {
        const force = (influenceRadius - distance) / influenceRadius - 0.1;
        const fx = dx / distance || 0;
        const fy = dy / distance || 0;

        point.vx += fx * force * 0.05;
        point.vy += fy * force * 0.05;

        if (Math.random() < 0.1) point.character = getRandomCharacter();
        point.color = distance < influenceRadius * 0.5 ? colors.primary : colors.secondary;
        point.opacity = Math.min(1, point.opacity + 0.1);
        point.size = fontSize * (1 + force * 0.2);
      } else {
        point.vx += (point.originalX - point.x) * 0.01;
        point.vy += (point.originalY - point.y) * 0.01;

        if (Math.random() < 0.005) point.character = getRandomCharacter();

        point.color = colors.dim;
        point.opacity = Math.max(0.5, point.opacity - 0.01);
        point.size = fontSize;
      }

      point.vx *= 0.9;
      point.vy *= 0.9;

      point.x += point.vx;
      point.y += point.vy;

      ctx.font = `${point.size}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = point.color;
      ctx.globalAlpha = point.opacity;
      ctx.fillText(point.character, point.x, point.y);
      ctx.globalAlpha = 1;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMouseMove = (e) => {
    if (!isMobile && hover) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const throttledMouseMove = (e) => {
    const now = performance.now();
    if (now - lastTimeRef.current > 16) {
      handleMouseMove(e);
      lastTimeRef.current = now;
    }
  };

  useEffect(() => {
    resizeCanvas();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener('mousemove', throttledMouseMove);
    window.addEventListener('resize', resizeCanvas);

    if (isMobile) {
      const handleTouch = (e) => {
        if (e.touches.length > 0) {
          mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };
      window.addEventListener('touchmove', handleTouch);
      return () => {
        window.removeEventListener('touchmove', handleTouch);
      };
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('mousemove', throttledMouseMove);
      window.removeEventListener('resize', resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, isMobile, isDark, colorScheme, density]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 z-[-1] w-full h-full', className)}
    />
  );
};

export default CipherBackground;
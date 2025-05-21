'use client';

import React, { useEffect, useRef } from 'react';

const MatrixBackground = ({ hover }) => {
  const canvasRef = useRef(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const spacing = 19;
    const fontSize = 16;
    let isPhone = window.innerWidth <= 768;

    const rows = isPhone ? Math.ceil(window.innerHeight / spacing) + 10 : Math.ceil(window.innerHeight / spacing) + 2;
    const cols = Math.ceil(window.innerWidth / spacing) + 2;
    const maxTravelDistance = spacing / 3;
    const influenceRadius = 125;
    const matrix = '$£richeno€₹₿.*';

    const dimmedBlue = 'rgba(100, 100, 100, 0.030)';
    const fullBlue = 'rgba(189, 230, 246, 0.050)';

    const getRandomCharacter = () => {
      return matrix.charAt(Math.floor(Math.random() * matrix.length));
    };

    const points = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        points.push({
          x: j * spacing,
          y: i * spacing,
          originalX: j * spacing,
          originalY: i * spacing,
          color: dimmedBlue,
          hoverColor: fullBlue,
          isMoving: false,
          opacity: 1,
          character: getRandomCharacter(),
          drop: 1
        });
      }
    }

    let mousePos = { x: 0, y: 0 };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const isMouseOutside =
        mousePos.x <= 0 || mousePos.y <= 0 || mousePos.x > canvas.width || mousePos.y > canvas.height;
      const currentInfluenceRadius = isMouseOutside ? 0 : influenceRadius;
      const influenceRadiusSquared = currentInfluenceRadius * currentInfluenceRadius;

      points.forEach((point) => {
        const dx = mousePos.x - point.x;
        const dy = mousePos.y - point.y;
        const distanceSquared = dx * dx + dy * dy;

        if (hover) {
          if (distanceSquared < influenceRadiusSquared) {
            const distance = Math.sqrt(distanceSquared);
            const force = (currentInfluenceRadius - distance) / currentInfluenceRadius;
            const forceFactor = force * 0.05;

            let newX = point.x + dx * forceFactor;
            let newY = point.y + dy * forceFactor;

            const dxTravel = newX - point.originalX;
            const dyTravel = newY - point.originalY;
            const travelDistanceSquared = dxTravel * dxTravel + dyTravel * dyTravel;

            if (travelDistanceSquared > maxTravelDistance * maxTravelDistance) {
              const angle = Math.atan2(dyTravel, dxTravel);
              newX = point.originalX + Math.cos(angle) * maxTravelDistance;
              newY = point.originalY + Math.sin(angle) * maxTravelDistance;
            }

            point.isMoving = newX !== point.x || newY !== point.y;
            point.x = newX;
            point.y = newY;
            point.color = point.isMoving ? point.hoverColor : fullBlue;
          } else {
            const dxReset = point.originalX - point.x;
            const dyReset = point.originalY - point.y;
            point.x += dxReset * 0.1;
            point.y += dyReset * 0.1;
            point.isMoving = Math.abs(dxReset) > 0.01 || Math.abs(dyReset) > 0.01;
            point.color = point.isMoving ? point.hoverColor : dimmedBlue;
          }
        } else {
          point.x = point.originalX;
          point.y = point.originalY;
          point.color = dimmedBlue;
        }

        if ((point.isMoving || Math.random() < 0.02) && Math.random() < 0.2) {
          point.character = getRandomCharacter();
        }

        ctx.fillStyle = point.color;
        ctx.globalAlpha = point.opacity;
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(point.character, point.x, point.y);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e) => {
      if (!isPhone && hover) {
        mousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const handleResize = () => {
      resizeCanvas();
      isPhone = window.innerWidth <= 768;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [year, hover]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-black"
    />
  );
};

export default MatrixBackground;
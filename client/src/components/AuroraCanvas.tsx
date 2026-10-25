import React, { useEffect, useRef } from 'react';

export const AuroraCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle constellation
    const numParticles = 65;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
    }> = [];

    const colors = ['#7C5CFF', '#22D3EE', '#3DDC97', '#FFB86B'];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random() * 400 + 100,
        radius: Math.random() * 2 + 1,
        color: colors[i % colors.length],
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    // 3D Wireframe Icosahedron vertices
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    // Normalize and scale
    const scale = Math.min(width, height) * 0.22;
    const vertices = baseVertices.map(([x, y, z]) => {
      const len = Math.sqrt(x * x + y * y + z * z);
      return [(x / len) * scale, (y / len) * scale, (z / len) * scale];
    });

    let angleX = 0;
    let angleY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - width / 2) * 0.0005;
      mouseY = (e.clientY - rect.top - height / 2) * 0.0005;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep glowing gradient background orb
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, 20,
        width / 2, height / 2, width * 0.45
      );
      grad.addColorStop(0, 'rgba(124, 92, 255, 0.22)');
      grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.08)');
      grad.addColorStop(1, 'rgba(5, 6, 11, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      angleX += 0.005 + mouseY;
      angleY += 0.007 + mouseX;

      // Project 3D to 2D
      const project = (x: number, y: number, z: number) => {
        // Rotate Y
        let x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
        let z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
        // Rotate X
        let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

        const fov = 450;
        const p = fov / (fov + z2 + 150);
        return {
          px: width / 2 + x1 * p,
          py: height / 2 + y2 * p,
          pz: z2,
        };
      };

      // Draw Orbiting Torus Rings
      const ringSteps = 40;
      const ringRadius = scale * 1.45;
      ctx.beginPath();
      for (let i = 0; i <= ringSteps; i++) {
        const theta = (i / ringSteps) * Math.PI * 2;
        const rx = Math.cos(theta) * ringRadius;
        const rz = Math.sin(theta) * ringRadius;
        const ry = Math.sin(theta * 2 + angleX) * 25;
        const p = project(rx, ry, rz);
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Projected Icosahedron Vertices & Lines
      const projectedVertices = vertices.map(([x, y, z]) => project(x, y, z));

      // Edges between close vertices
      ctx.strokeStyle = 'rgba(124, 92, 255, 0.5)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < projectedVertices.length; i++) {
        for (let j = i + 1; j < projectedVertices.length; j++) {
          const v1 = vertices[i];
          const v2 = vertices[j];
          const dist3D = Math.hypot(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]);
          if (dist3D < scale * 1.2) {
            ctx.beginPath();
            ctx.moveTo(projectedVertices[i].px, projectedVertices[i].py);
            ctx.lineTo(projectedVertices[j].px, projectedVertices[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw Glowing Vertices
      for (const pv of projectedVertices) {
        ctx.beginPath();
        ctx.arc(pv.px, pv.py, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#22D3EE';
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Particles
      for (const pt of particles) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (Math.abs(pt.x) > width / 2) pt.vx *= -1;
        if (Math.abs(pt.y) > height / 2) pt.vy *= -1;

        const p = project(pt.x, pt.y, pt.z);
        ctx.beginPath();
        ctx.arc(p.px, p.py, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Aurora Glass Capability Badges (Strictly Generic & Safe) */}
      <div className="absolute top-12 left-6 sm:left-12 glass-panel px-4 py-2.5 rounded-2xl border border-aurora-violet/40 shadow-xl animate-float pointer-events-none">
        <p className="text-[10px] uppercase font-mono font-bold text-aurora-violet tracking-wider">Module 04</p>
        <p className="text-xs font-semibold text-white">Attendance Workflow</p>
        <span className="text-[11px] text-aurora-cyan">09:15 Grace & Geofence</span>
      </div>

      <div className="absolute bottom-16 left-8 sm:left-20 glass-panel px-4 py-2.5 rounded-2xl border border-aurora-cyan/40 shadow-xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
        <p className="text-[10px] uppercase font-mono font-bold text-aurora-cyan tracking-wider">Module 05</p>
        <p className="text-xs font-semibold text-white">Leave Approvals</p>
        <span className="text-[11px] text-aurora-mint">Smart Leave AI Input</span>
      </div>

      <div className="absolute top-24 right-6 sm:right-16 glass-panel px-4 py-2.5 rounded-2xl border border-aurora-mint/40 shadow-xl animate-float pointer-events-none" style={{ animationDelay: '4s' }}>
        <p className="text-[10px] uppercase font-mono font-bold text-aurora-mint tracking-wider">Module 06</p>
        <p className="text-xs font-semibold text-white">Payroll Controls</p>
        <span className="text-[11px] text-aurora-amber">Progressive Tax & PDF Payslips</span>
      </div>
    </div>
  );
};

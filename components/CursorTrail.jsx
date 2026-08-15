"use client";
import { useEffect, useRef } from "react";

export function CursorTrail() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let points = [];
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const addPoint = (e) => {
            points.push({
                x: e.clientX,
                y: e.clientY,
                age: 0,
            });
        };

        window.addEventListener("mousemove", addPoint);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            points.forEach((p) => p.age++);
            points = points.filter((p) => p.age < 30); // Lives for 30 frames

            if (points.length > 1) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#f81ce5"; // Pink glow

                for (let i = 0; i < points.length - 1; i++) {
                    const p = points[i];
                    const next = points[i + 1];

                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(next.x, next.y);

                    const opacity = Math.max(0, 1 - p.age / 30);

                    // Cyberpunk pink trail
                    ctx.strokeStyle = `rgba(248, 28, 229, ${opacity})`;
                    ctx.lineWidth = Math.max(1, 6 * opacity);

                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", addPoint);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9999]" style={{ mixBlendMode: "screen" }} />;
}

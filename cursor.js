// Cursor Effect for Home Page
document.addEventListener('DOMContentLoaded', () => {
    // Check if device is mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Skip cursor effect on mobile
    if (isMobile) {
        return;
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-canvas';
    canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; pointer-events: none; background: transparent;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let mouse = { x: null, y: null };

    // In cursor.js

    // Setup canvas
    const setupCanvas = () => {
        // 1. Get the device's pixel ratio
        const dpr = window.devicePixelRatio || 1;

        // 2. Get the size of the canvas in CSS pixels
        const rect = canvas.getBoundingClientRect();

        // 3. Set the canvas's drawing surface size to match the physical pixels
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // 4. Scale the drawing context down by the same amount
        // This allows you to use CSS pixel coordinates for all drawing operations
        ctx.scale(dpr, dpr);
    };

    // Mouse move handler
    const handleMouseMove = (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(mouse.x, mouse.y));
        }
    };

    // Particle class
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 6 - 3;
            this.life = 1;
            const baseHue = 45;
            const hueSpread = 40;
            const hue = baseHue + (Math.random() * hueSpread) - (hueSpread / 2);
            this.color = `hsl(${hue}, 100%, ${60 + Math.random() * 25}%)`;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.1) this.size -= 0.05;
            this.life -= 0.025;
        }
        draw() {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Animation loop
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1;

        // Draw custom cursor
        if (mouse.x) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        requestAnimationFrame(animate);
    };

    // Initialize
    setupCanvas();
    animate();

    // Event listeners
    window.addEventListener('resize', setupCanvas);
    window.addEventListener('mousemove', handleMouseMove);
});
// Wait for explicit user gesture before initializing the splash
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("start-overlay");
    const startCircle = document.getElementById("start-circle");

    // Show cursor on overlay for desktop users
    overlay.style.cursor = 'default';
    startCircle.style.cursor = 'pointer';

    const startSplash = () => {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 600);
        initializeSplash();
    };

    startCircle.addEventListener("click", startSplash);
    startCircle.addEventListener("touchstart", startSplash, { passive: true });
});

function initializeSplash() {
    const canvas = document.getElementById('visual-canvas');
    const ctx = canvas.getContext('2d');
    const initialNodes = Array.from(document.querySelectorAll('.node:not(#last-node)'));
    const lastNode = document.getElementById('last-node');
    const allNodes = [...initialNodes, lastNode];
    const successScreen = document.getElementById('success-screen');

    let particles = [];
    let fireworkParticles = [];
    let mouse = { x: null, y: null };
    const visitedNodes = new Set();
    let energyPulses = [];
    let nodeCycle = [];

    const getCenter = (element) => {
        if (!element || element.style.display === 'none') return null;
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const getEdgePoint = (fromElement, toElement) => {
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();

        const fromCenter = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
        const toCenter = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };

        const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);

        const halfWidthFrom = fromRect.width / 2;
        const halfHeightFrom = fromRect.height / 2;
        const tanAngle = Math.tan(angle);
        let fromEdgeX, fromEdgeY;

        if (Math.abs(tanAngle) <= halfHeightFrom / halfWidthFrom) {
            if (toCenter.x > fromCenter.x) {
                fromEdgeX = fromCenter.x + halfWidthFrom;
                fromEdgeY = fromCenter.y + (fromEdgeX - fromCenter.x) * tanAngle;
            } else {
                fromEdgeX = fromCenter.x - halfWidthFrom;
                fromEdgeY = fromCenter.y + (fromEdgeX - fromCenter.x) * tanAngle;
            }
        } else {
            if (toCenter.y > fromCenter.y) {
                fromEdgeY = fromCenter.y + halfHeightFrom;
                fromEdgeX = fromCenter.x + (fromEdgeY - fromCenter.y) / tanAngle;
            } else {
                fromEdgeY = fromCenter.y - halfHeightFrom;
                fromEdgeX = fromCenter.x + (fromEdgeY - fromCenter.y) / tanAngle;
            }
        }

        const halfWidthTo = toRect.width / 2;
        const halfHeightTo = toRect.height / 2;
        let toEdgeX, toEdgeY;

        if (Math.abs(tanAngle) <= halfHeightTo / halfWidthTo) {
            if (toCenter.x > fromCenter.x) {
                toEdgeX = toCenter.x - halfWidthTo;
                toEdgeY = toCenter.y - (toCenter.x - toEdgeX) * tanAngle;
            } else {
                toEdgeX = toCenter.x + halfWidthTo;
                toEdgeY = toCenter.y - (toCenter.x - toEdgeX) * tanAngle;
            }
        } else {
            if (toCenter.y > fromCenter.y) {
                toEdgeY = toCenter.y - halfHeightTo;
                toEdgeX = toCenter.x - (toCenter.y - toEdgeY) / tanAngle;
            } else {
                toEdgeY = toCenter.y + halfHeightTo;
                toEdgeX = toCenter.x - (toCenter.y - toEdgeY) / tanAngle;
            }
        }

        return { from: { x: fromEdgeX, y: fromEdgeY }, to: { x: toEdgeX, y: toEdgeY } };
    };

    const setupCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    const positionInitialNodes = () => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        
        // Detect mobile/tablet vs desktop
        const isMobile = W < 768;
        const nodeWidth = isMobile ? 120 : 160;
        const nodeHeight = isMobile ? 48 : 64;
        const fontSize = isMobile ? '0.75rem' : '0.875rem';

        const safeMargin = {
            x: Math.max(isMobile ? 40 : 60, W * 0.1),
            y: Math.max(isMobile ? 40 : 60, H * 0.1)
        };
        const halfW = W / 2;
        const halfH = H / 2;

        // Quadrants arranged in proper order to form a loop
        const quadrants = [
            { x: safeMargin.x, y: safeMargin.y, w: halfW - safeMargin.x * 1.5, h: halfH - safeMargin.y * 1.5 },
            { x: halfW + safeMargin.x * 0.5, y: safeMargin.y, w: halfW - safeMargin.x * 1.5, h: halfH - safeMargin.y * 1.5 },
            { x: halfW + safeMargin.x * 0.5, y: halfH + safeMargin.y * 0.5, w: halfW - safeMargin.x * 1.5, h: halfH - safeMargin.y * 1.5 },
            { x: safeMargin.x, y: halfH + safeMargin.y * 0.5, w: halfW - safeMargin.x * 1.5, h: halfH - safeMargin.y * 1.5 }
        ];

        // Don't randomize the order - keep nodes in sequence to form proper loop
        nodeCycle = [...initialNodes];

        nodeCycle.forEach((node, index) => {
            const q = quadrants[index];
            const x = q.x + Math.random() * Math.max(0, q.w - nodeWidth);
            const y = q.y + Math.random() * Math.max(0, q.h - nodeHeight);
            node.dataset.targetX = x;
            node.dataset.targetY = y;
            // Start from center, hidden
            node.style.left = `${W / 2 - nodeWidth / 2}px`;
            node.style.top = `${H / 2 - nodeHeight / 2}px`;
            node.style.opacity = '0';
            node.style.width = `${nodeWidth}px`;
            node.style.height = `${nodeHeight}px`;
            node.style.fontSize = fontSize;
            node.className = 'node absolute bg-transparent border-2 border-yellow-400 flex items-center justify-center font-bold select-none transition-all duration-300';
        });
        
        // Also adjust last node size
        if (lastNode) {
            lastNode.style.width = `${nodeWidth}px`;
            lastNode.style.height = `${nodeHeight}px`;
            lastNode.style.fontSize = fontSize;
        }
    };

    async function flyOutNodesSequentially() {
        for (let i = 0; i < nodeCycle.length; i++) {
            const node = nodeCycle[i];
            node.style.opacity = '1';
            await new Promise((resolve) => {
                const startX = parseFloat(node.style.left);
                const startY = parseFloat(node.style.top);
                const endX = parseFloat(node.dataset.targetX);
                const endY = parseFloat(node.dataset.targetY);
                const duration = 800;
                const startTime = performance.now();

                const animate = (time) => {
                    const t = Math.min(1, (time - startTime) / duration);
                    const ease = 1 - Math.pow(1 - t, 3);
                    const x = startX + (endX - startX) * ease;
                    const y = startY + (endY - startY) * ease;
                    node.style.left = `${x}px`;
                    node.style.top = `${y}px`;
                    if (t < 1) requestAnimationFrame(animate);
                    else resolve();
                };
                requestAnimationFrame(animate);
            });
            await new Promise(r => setTimeout(r, 150));
        }
    }

    const createPulsesFromVisitedNodes = () => {
        energyPulses = [];

        visitedNodes.forEach(visitedNode => {
            const startPoint = getCenter(visitedNode);
            if (!startPoint) return;

            if (initialNodes.includes(visitedNode)) {
                const currentIndex = nodeCycle.indexOf(visitedNode);
                const nextNode = nodeCycle[(currentIndex + 1) % nodeCycle.length];
                const prevNode = nodeCycle[(currentIndex - 1 + nodeCycle.length) % nodeCycle.length];

                if (!visitedNodes.has(nextNode)) {
                    energyPulses.push(new EnergyPulse(visitedNode, nextNode));
                }
                if (!visitedNodes.has(prevNode)) {
                    energyPulses.push(new EnergyPulse(visitedNode, prevNode));
                }

                if (visitedNodes.size === initialNodes.length && lastNode.style.display !== 'none' && !visitedNodes.has(lastNode)) {
                    energyPulses.push(new EnergyPulse(visitedNode, lastNode));
                }
            }
            else if (visitedNode === lastNode) {
                initialNodes.forEach(outerNode => {
                    if (!visitedNodes.has(outerNode)) {
                        energyPulses.push(new EnergyPulse(visitedNode, outerNode));
                    }
                });
            }
        });
    };

    const handleMouseMove = (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        for (let i = 0; i < 5; i++) particles.push(new Particle(mouse.x, mouse.y));
    };

    const handleTouchMove = (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            for (let i = 0; i < 5; i++) particles.push(new Particle(mouse.x, mouse.y));
            
            // Check if touch is over any node
            const touch = e.touches[0];
            const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elementAtTouch && elementAtTouch.classList.contains('node')) {
                handleNodeEnter({ currentTarget: elementAtTouch });
            }
        }
    };

    const handleNodeEnter = (event) => {
        const node = event.currentTarget;

        if (!visitedNodes.has(node)) {
            node.classList.add('visited');
            visitedNodes.add(node);

            if (node === lastNode) {
                const center = getCenter(lastNode);
                if (center) {
                    createFireworkBurst(center.x, center.y);
                }
            }
        }

        if (visitedNodes.size === initialNodes.length && lastNode.style.display === 'none') {
            lastNode.style.display = 'flex';
        }

        createPulsesFromVisitedNodes();

        if (visitedNodes.size === allNodes.length) {
            energyPulses = [];
            setTimeout(() => {
                window.location.href = 'portfolio.html';
            }, 1000);
        }
    };

    const handleNodeTouch = (e) => {
        e.preventDefault();
        handleNodeEnter(e);
    };

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
            const hue = (baseHue + (Math.random() * hueSpread) - (hueSpread / 2));
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

    class FireworkParticle {
        constructor(x, y, hue) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 4;
            this.speedX = Math.cos(angle) * speed;
            this.speedY = Math.sin(angle) * speed;
            this.size = Math.random() * 4 + 2;
            this.life = 1;
            this.gravity = 0.15;
            this.hue = hue;
            this.color = `hsl(${hue}, 100%, ${60 + Math.random() * 20}%)`;
        }
        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= 0.015;
            if (this.size > 0.1) this.size -= 0.08;
        }
        draw() {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    const createFireworkBurst = (x, y) => {
        const hues = [45, 30, 60, 50, 40];
        for (let i = 0; i < 100; i++) {
            const hue = hues[Math.floor(Math.random() * hues.length)];
            fireworkParticles.push(new FireworkParticle(x, y, hue));
        }
    };

    class EnergyPulse {
        constructor(fromNode, toNode) {
            this.fromNode = fromNode;
            this.toNode = toNode;
            this.progress = 0;
            this.tailLength = 0.15;
        }
        update() {
            this.progress += 0.015;
            if (this.progress > 1 + this.tailLength) this.progress = 0;
        }
        draw() {
            const edgePoints = getEdgePoint(this.fromNode, this.toNode);
            if (!edgePoints) return;

            const start = edgePoints.from;
            const end = edgePoints.to;

            const headProgress = Math.min(this.progress, 1);
            const tailProgress = Math.max(0, this.progress - this.tailLength);
            if (headProgress <= tailProgress) return;

            const headX = start.x + (end.x - start.x) * headProgress;
            const headY = start.y + (end.y - start.y) * headProgress;
            const tailX = start.x + (end.x - start.x) * tailProgress;
            const tailY = start.y + (end.y - start.y) * tailProgress;
            const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
            gradient.addColorStop(0, 'rgba(254, 240, 138, 0)');
            gradient.addColorStop(1, '#fef08a');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < nodeCycle.length; i++) {
            const startNode = nodeCycle[i];
            const endNode = nodeCycle[(i + 1) % nodeCycle.length];
            const edgePoints = getEdgePoint(startNode, endNode);
            if (edgePoints) {
                const bothVisited = visitedNodes.has(startNode) && visitedNodes.has(endNode);
                ctx.beginPath();
                ctx.moveTo(edgePoints.from.x, edgePoints.from.y);
                ctx.lineTo(edgePoints.to.x, edgePoints.to.y);
                ctx.lineWidth = bothVisited ? 3 : 2;
                ctx.strokeStyle = bothVisited ? '#facc15' : 'rgba(250, 204, 21, 0.2)';
                if (bothVisited) {
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 10;
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        if (lastNode.style.display !== 'none') {
            initialNodes.forEach(node => {
                const edgePoints = getEdgePoint(node, lastNode);
                if (edgePoints) {
                    const bothVisited = visitedNodes.has(node) && visitedNodes.has(lastNode);
                    ctx.beginPath();
                    ctx.moveTo(edgePoints.from.x, edgePoints.from.y);
                    ctx.lineTo(edgePoints.to.x, edgePoints.to.y);
                    ctx.lineWidth = bothVisited ? 3 : 2;
                    ctx.strokeStyle = bothVisited ? '#facc15' : 'rgba(250, 204, 21, 0.2)';
                    if (bothVisited) {
                        ctx.shadowColor = '#facc15';
                        ctx.shadowBlur = 10;
                    }
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });
        }

        energyPulses.forEach(pulse => {
            pulse.update();
            pulse.draw();
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
            fireworkParticles[i].update();
            fireworkParticles[i].draw();
            if (fireworkParticles[i].life <= 0) fireworkParticles.splice(i, 1);
        }

        ctx.globalAlpha = 1;

        if (mouse.x) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        requestAnimationFrame(animate);
    };

    lastNode.style.display = 'none';
    setupCanvas();
    positionInitialNodes();

    // Fly out nodes sequentially, then start animation
    flyOutNodesSequentially().then(() => {
        animate();

        window.addEventListener('resize', () => {
            setupCanvas();
            positionInitialNodes();
            lastNode.style.display = 'none';
            visitedNodes.clear();
            allNodes.forEach(n => n.classList.remove('visited'));
            energyPulses = [];
        });

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });

        allNodes.forEach(node => {
            node.addEventListener('mouseenter', handleNodeEnter);
            node.addEventListener('touchstart', handleNodeTouch, { passive: false });
        });

        document.getElementById('next-page-button').addEventListener('click', () => location.reload());
    });
}
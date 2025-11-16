// BACKUP: Original JavaScript-based DotGrid implementation
// This file contains the original high-performance-cost animation code
// Kept for reference or rollback if needed

class DotGrid {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'dot-grid';
        this.dots = [];
        this.spacing = 25;
        this.frameInterval = 1000 / 70;
        this.waveSpeed = 3;
        this.rotationSpeed = 0.5;  // Keep this for square wave rotation only
        this.maxRadius = Math.sqrt(
            Math.max(window.innerWidth, document.documentElement.scrollWidth) ** 2 + 
            Math.max(window.innerHeight, document.documentElement.scrollHeight) ** 2
        ) * 1.2;
        this.centerX = window.innerWidth / 2;
        this.centerY = window.innerHeight / 2;
        this.waves = [];
        this.maxWaves = 1; 
        this.activeWaveCount = 0;
        this.lastFrame = 0;
        
        this.init();
        this.startWaveAnimation();
    }

    init() {
        // Calculate grid size to cover entire document
        const cols = Math.ceil(Math.max(window.innerWidth, document.documentElement.scrollWidth) / this.spacing);
        const rows = Math.ceil(Math.max(window.innerHeight, document.documentElement.scrollHeight) / this.spacing);

        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                
                const x = j * this.spacing;
                const y = i * this.spacing;
                
                dot.style.left = x + 'px';
                dot.style.top = y + 'px';
                
                this.dots.push(dot);
                fragment.appendChild(dot);
            }
        }
        
        this.container.appendChild(fragment);
        document.body.insertBefore(this.container, document.body.firstChild);
    }

    createWave() {
        return {
            radius: 0,
            speed: this.waveSpeed,
            maxRadius: this.maxRadius,
            rotation: 0 // Initial rotation angle
        };
    }

    animateWaves() {
        const now = performance.now();
        if (now - this.lastFrame < this.frameInterval) {
            requestAnimationFrame(() => this.animateWaves());
            return;
        }
        this.lastFrame = now;

        if (this.waves.length === 0) {
            this.waves.push(this.createWave());
        }

        const activeDots = new Set();
        
        this.waves = this.waves.filter(wave => {
            wave.radius += wave.speed * (this.frameInterval / 16.67);
            wave.rotation += this.rotationSpeed * (this.frameInterval / 16.67);
            const waveThickness = this.spacing * 2;

            for (let dot of this.dots) {
                const x = parseFloat(dot.style.left);
                const y = parseFloat(dot.style.top);
                
                const dx = x - this.centerX;
                const dy = y - this.centerY;
                
                // Rotate the square wave pattern, not the dots
                const rotationRad = wave.rotation * (Math.PI / 180);
                const rotatedX = dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
                const rotatedY = dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
                
                const distanceFromSquare = Math.max(
                    Math.abs(rotatedX) - wave.radius,
                    Math.abs(rotatedY) - wave.radius
                );

                if (Math.abs(distanceFromSquare) <= waveThickness) {
                    if (!activeDots.has(dot)) {
                        activeDots.add(dot);
                        if (!dot.classList.contains('wave')) {
                            dot.classList.add('wave');
                            setTimeout(() => {
                                dot.classList.remove('wave');
                            }, 2000);
                        }
                    }
                }
            }

            return wave.radius < wave.maxRadius;
        });

        // More gradual wave timing
        if (this.waves.length > 0 && 
            this.waves[this.waves.length - 1].radius > this.spacing * 20) {  // Increased spacing between waves
            this.waves.push(this.createWave());
        }

        requestAnimationFrame(() => this.animateWaves());
    }

    startWaveAnimation() {
        this.animateWaves();
    }
}


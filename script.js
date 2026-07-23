/* ══════════════════════════════════════════════════════════════
   KASTRUS — AAA Interactive System
   Three.js + GSAP + Lenis
   ══════════════════════════════════════════════════════════════ */

(function(){
    'use strict';

    /* ─── MOBILE DETECTION ─── */
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    /* ─── REMOVE FLICKERING ELEMENTS ON MOBILE ─── */
    if (isMobile) {
        var els = document.querySelectorAll('.noise,.scanlines,.overlay,.cinematic__grain,.cinematic__particles');
        els.forEach(function(el) { el.remove(); });
        var svgFilter = document.getElementById('noiseFilter');
        if (svgFilter) svgFilter.closest('svg').remove();
    }

    /* ─── LOADER ─── */
    const loader = document.getElementById('loader');
    const progress = document.getElementById('loaderProgress');
    const percent = document.getElementById('loaderPercent');
    let loadVal = 0;
    const criticalImages = ['assets/scene-01.webp','assets/scene-02.webp','assets/scene-03.webp','assets/scene-04.webp','assets/scene-05.webp','assets/scene-06.webp','assets/scene-07.webp'];
    let imagesLoaded = 0;

    function updateLoader() {
        loadVal += Math.random() * 15 + 5;
        if (loadVal > 90) loadVal = 90;
        progress.style.width = loadVal + '%';
        percent.textContent = Math.floor(loadVal) + '%';
        if (loadVal < 100) {
            setTimeout(updateLoader, 40 + Math.random() * 60);
        }
    }
    updateLoader();

    // Real image preload check
    let allReady = false;
    function checkAllReady() {
        if (allReady) return;
        if (imagesLoaded >= criticalImages.length && loadVal >= 90) {
            allReady = true;
            loadVal = 100;
            progress.style.width = '100%';
            percent.textContent = '100%';
            setTimeout(() => {
                loader.classList.add('hidden');
                init();
            }, 100);
        }
    }

    criticalImages.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => { imagesLoaded++; checkAllReady(); };
        img.src = src;
    });

    // Fallback: force start after 2s
    setTimeout(() => {
        if (!allReady) { allReady = true; loader.classList.add('hidden'); init(); }
    }, 2000);

    /* ─── MAIN INIT ─── */
    function init() {
        initCinematic();
        initCinematicParticles();
        initLenis();
        initThreeScene();
        initGSAP();
        initNav();
        initYouTube();
        initFormInteractions();
        initIntelFeed();
        initScrollConsolidated();
        initCursor();
        initMagneticButtons();
        initTextReveal();
        init3DTilt();
    };

    /* ─── CONSOLIDATED SCROLL LISTENER ─── */
    var scrollState = { heroProgress: 0, sectionParallax: {}, cinematicProgress: 0, threeProgress: 0 };

    function initScrollConsolidated() {
        const heroEl = document.querySelector('.hero');
        const bgSections = ['.about', '.live', '.clipes', '.arquivo', '.operacoes', '.agenda', '.contato', '.intel'];
        const bgEls = bgSections.map(s => document.querySelector(s)).filter(Boolean);
        const cinematicSection = document.querySelector('.cinematic');
        const nav = document.getElementById('nav');
        const scrollBar = document.getElementById('scrollProgress');

        // Visibility observer
        const sections = [
            { el: document.querySelector('.hero'), cls: 'hero--visible' },
            { el: document.querySelector('.about'), cls: 'about--visible' },
            { el: document.querySelector('.live'), cls: 'live--visible' },
            { el: document.querySelector('.clipes'), cls: 'clipes--visible' },
            { el: document.querySelector('.arquivo'), cls: 'arquivo--visible' },
            { el: document.querySelector('.operacoes'), cls: 'operacoes--visible' },
            { el: document.querySelector('.agenda'), cls: 'agenda--visible' },
            { el: document.querySelector('.intel'), cls: 'intel--visible' },
            { el: document.querySelector('.contato'), cls: 'contato--visible' },
        ];
        const visObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const found = sections.find(s => s.el === entry.target);
                    if (found && found.cls) entry.target.classList.add(found.cls);
                }
            });
        }, { threshold: 0.15 });
        sections.forEach(s => { if (s.el) visObs.observe(s.el); });

        // SINGLE scroll handler for everything
        window.addEventListener('scroll', function() {
            var scrollY = window.scrollY;
            var docH = document.documentElement.scrollHeight - window.innerHeight;

            // Hero parallax
            if (heroEl) {
                var rect = heroEl.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    var p = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
                    heroEl.style.setProperty('--hero-parallax', (p * 80) + 'px');
                    scrollState.heroProgress = p;
                }
            }

            // Section parallax
            bgEls.forEach(function(el) {
                var rect = el.getBoundingClientRect();
                if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
                var progress = (window.innerHeight - rect.top) / (window.innerHeight + el.offsetHeight);
                el.style.setProperty('--section-parallax', ((progress - 0.5) * 40) + 'px');
            });

            // Cinematic progress
            if (cinematicSection) {
                var cRect = cinematicSection.getBoundingClientRect();
                var cH = cinematicSection.offsetHeight - window.innerHeight;
                scrollState.cinematicProgress = Math.max(0, Math.min(1, -cRect.top / cH));
            }

            // Three.js progress
            scrollState.threeProgress = scrollY / docH;

            // Nav scroll state
            if (nav) nav.classList.toggle('scrolled', scrollY > 80);

            // Scroll progress bar
            if (scrollBar) scrollBar.style.width = (scrollY / docH * 100) + '%';
        }, { passive: true });
    }

    /* ─── CINEMATIC INTRO ─── */
    function initCinematic() {
        const section = document.querySelector('.cinematic');
        if (!section) return;

        const scenes = gsap.utils.toArray('.cinematic__scene');
        const labels = gsap.utils.toArray('.cinematic__label');
        const lines = gsap.utils.toArray('.cinematic__line');
        const flash = document.querySelector('.cinematic__flash');
        const cta = document.getElementById('cinematicCta');
        const fill = document.getElementById('cinematicFill');
        const hint = document.getElementById('cinematicHint');
        const viewport = document.querySelector('.cinematic__viewport');
        const totalScenes = scenes.length;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.8,
                onUpdate: (self) => {
                    if (fill) fill.style.height = (self.progress * 100) + '%';
                    if (hint) hint.style.opacity = self.progress > 0.05 ? '0' : '1';
                }
            }
        });

        const configs = [
            [1.0,  1.15, 0,  0,  0],
            [1.15, 1.35, 0,  3,  0.5],
            [1.35, 1.6,  3,  5,  0.2],
            [1.6,  1.9,  5,  2,  0.1],
            [1.9,  2.3,  2,  0,  0.3],
            [2.3,  2.6,  0,  0,  0.9],
            [2.6,  1.0,  0,  0,  0],
        ];

        scenes.forEach((scene, i) => {
            const img = scene.querySelector('.cinematic__img');
            const label = labels[i];
            const line = lines[i];
            const cfg = configs[i];
            const segDur = 1 / totalScenes;
            const segStart = i * segDur;
            const prev = i > 0 ? scenes[i - 1] : null;
            const prevLabel = i > 0 ? labels[i - 1] : null;
            const prevLine = i > 0 ? lines[i - 1] : null;

            if (i === 0) {
                tl.to(img, { scale: cfg[1], duration: segDur, ease: 'none' }, segStart);
                if (label) tl.to(label, { opacity: 1, y: 0, duration: segDur * 0.4, ease: 'power2.out' }, segStart + segDur * 0.1);
                if (line) tl.to(line, { opacity: 1, scaleX: 1, duration: segDur * 0.3, ease: 'power2.out' }, segStart + segDur * 0.2);
            } else {
                tl.to(prev, { opacity: 0, duration: segDur * 0.6, ease: 'power2.inOut' }, segStart);
                if (prevLabel) tl.to(prevLabel, { opacity: 0, y: -25, duration: segDur * 0.3, ease: 'power2.in' }, segStart);
                if (prevLine) tl.to(prevLine, { opacity: 0, scaleX: 0, duration: segDur * 0.2, ease: 'power2.in' }, segStart);
                tl.to(prev.querySelector('.cinematic__img'), { scale: cfg[1], duration: segDur, ease: 'none' }, segStart);
                tl.to(scene, { opacity: 1, duration: segDur * 0.6, ease: 'power2.inOut' }, segStart + segDur * 0.3);
                tl.fromTo(img, { scale: cfg[0] }, { scale: cfg[1], duration: segDur, ease: 'none' }, segStart);
                if (label) tl.fromTo(label, { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: segDur * 0.4, ease: 'power2.out' }, segStart + segDur * 0.4);
                if (line) tl.fromTo(line, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: segDur * 0.3, ease: 'power2.out' }, segStart + segDur * 0.45);
            }

            if (prev && (cfg[2] > 0 || cfg[3] > 0)) {
                tl.to(prev, { filter: 'blur(' + cfg[3] + 'px)', duration: segDur, ease: 'none' }, segStart);
            }
            if (cfg[4] > 0) {
                tl.to(viewport, { boxShadow: 'inset 0 0 ' + (cfg[4] * 100) + 'px rgba(255,122,0,' + (cfg[4] * 0.3) + ')', duration: segDur, ease: 'none' }, segStart);
            }
        });

        const flashStart = 5 / totalScenes;
        tl.to(flash, { opacity: 0.9, duration: 0.08, ease: 'power4.in' }, flashStart + 0.3 / totalScenes);
        tl.to(flash, { opacity: 0, duration: 0.4, ease: 'power2.out' }, flashStart + 0.4 / totalScenes);

        const revealStart = 6 / totalScenes;
        tl.call(function() { if (cta) cta.style.display = 'flex'; }, null, revealStart + 0.15 / totalScenes);
        tl.fromTo(cta, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5 / totalScenes, ease: 'power2.out' }, revealStart + 0.2 / totalScenes);

        var btn = document.getElementById('cinematicBtn');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.lenis) {
                    window.lenis.scrollTo('#hero', { duration: 2.5, offset: -80 });
                } else {
                    document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /* ─── CINEMATIC PARTICLES ─── */
    function initCinematicParticles() {
        if (isMobile) return;
        const canvas = document.getElementById('cinematicParticles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animId;

        function resize() {
            const vp = document.querySelector('.cinematic__viewport');
            if (!vp) return;
            canvas.width = vp.offsetWidth;
            canvas.height = vp.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        var count = isMobile ? 25 : 60;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                hue: Math.random() > 0.6 ? 25 : 210,
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var sp = scrollState.cinematicProgress || 0;
            const sceneIndex = Math.floor(sp * 7);
            const sceneFrac = (sp * 7) % 1;

            particles.forEach(p => {
                let dx = p.speedX;
                let dy = p.speedY;

                if (sceneIndex <= 1) {
                    dy = -Math.abs(p.speedY) * 0.8 - 0.2;
                    dx = Math.sin(Date.now() * 0.001 + p.x) * 0.3;
                } else if (sceneIndex <= 3) {
                    dy = Math.abs(p.speedY) * 3 + 1;
                    dx = p.speedX * 0.5;
                } else if (sceneIndex <= 5) {
                    if (sceneIndex === 5) {
                        const angle = Math.atan2(p.y - canvas.height / 2, p.x - canvas.width / 2);
                        const burstSpeed = sceneFrac * 4;
                        dx = Math.cos(angle) * burstSpeed;
                        dy = Math.sin(angle) * burstSpeed;
                    } else {
                        dy = Math.abs(p.speedY) * 2 + 1.5;
                    }
                } else {
                    dx *= 0.95;
                    dy *= 0.95;
                }

                p.x += dx;
                p.y += dy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = 'hsla(' + p.hue + ', 80%, 60%, ' + p.opacity + ')';
                ctx.fill();
            });

            animId = requestAnimationFrame(animate);
        }
        animate();

        const section = document.querySelector('.cinematic');
        if (section) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) cancelAnimationFrame(animId);
                    else animate();
                });
            }, { threshold: 0 });
            observer.observe(section);
        }
    }

    /* ─── LENIS SMOOTH SCROLL ─── */
    function initLenis() {
        // Skip Lenis on mobile — native scroll is smoother
        if (isMobile) return;

        window.lenis = new Lenis({
            duration: 1.2,
            easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            orientation: 'vertical',
            smoothWheel: true,
        });

        function raf(time) {
            window.lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        window.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function(time) { window.lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    /* ─── THREE.JS SCENE ─── */
    function initThreeScene() {
        var canvas = document.getElementById('webgl-canvas');
        if (!canvas) return;

        if (isMobile || window.innerWidth < 768) {
            canvas.style.display = 'none';
            return;
        }

        var scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050608, 0.002);

        var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 30);

        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x050608, 1);

        var ambientLight = new THREE.AmbientLight(0x1B2430, 0.5);
        scene.add(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xFF7A00, 0.8);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        var pointLight1 = new THREE.PointLight(0xFF7A00, 1.5, 50);
        pointLight1.position.set(-10, 10, 5);
        scene.add(pointLight1);

        var pointLight2 = new THREE.PointLight(0x5AA9FF, 0.8, 40);
        pointLight2.position.set(15, 8, -10);
        scene.add(pointLight2);

        var gridHelper = new THREE.GridHelper(200, 40, 0xFF7A00, 0x1B2430);
        gridHelper.position.y = -5;
        gridHelper.material.opacity = 0.15;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        var structureMat = new THREE.MeshPhongMaterial({
            color: 0x0D1117, emissive: 0xFF7A00, emissiveIntensity: 0.05,
            wireframe: false, transparent: true, opacity: 0.8,
        });

        for (var i = 0; i < 12; i++) {
            var h = 5 + Math.random() * 20;
            var w = 1 + Math.random() * 3;
            var geo = new THREE.BoxGeometry(w, h, w);
            var mesh = new THREE.Mesh(geo, structureMat.clone());
            mesh.position.set((Math.random() - 0.5) * 80, h / 2 - 5, (Math.random() - 0.5) * 80 - 20);
            mesh.material.emissiveIntensity = 0.02 + Math.random() * 0.06;
            scene.add(mesh);
        }

        var wireMat = new THREE.MeshBasicMaterial({ color: 0xFF7A00, wireframe: true, transparent: true, opacity: 0.15 });
        var wireCubes = [];
        for (var j = 0; j < 6; j++) {
            var size = 1 + Math.random() * 3;
            var geo2 = new THREE.BoxGeometry(size, size, size);
            var mesh2 = new THREE.Mesh(geo2, wireMat.clone());
            mesh2.position.set((Math.random() - 0.5) * 60, Math.random() * 20 - 5, (Math.random() - 0.5) * 60 - 10);
            mesh2.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            scene.add(mesh2);
            wireCubes.push(mesh2);
        }

        var particleCount = 150;
        var particleGeo = new THREE.BufferGeometry();
        var positions = new Float32Array(particleCount * 3);
        var colors = new Float32Array(particleCount * 3);
        for (var k = 0; k < particleCount; k++) {
            positions[k * 3] = (Math.random() - 0.5) * 100;
            positions[k * 3 + 1] = Math.random() * 40 - 5;
            positions[k * 3 + 2] = (Math.random() - 0.5) * 100;
            var isOrange = Math.random() > 0.6;
            colors[k * 3] = isOrange ? 1 : 0.35;
            colors[k * 3 + 1] = isOrange ? 0.48 : 0.66;
            colors[k * 3 + 2] = isOrange ? 0 : 1;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var particleMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        var particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        var mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', function(e) {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        window.addEventListener('resize', function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        var clock = new THREE.Clock();
        var isThreeVisible = true;
        var animFrameId;

        var threeObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                isThreeVisible = entry.isIntersecting;
                if (isThreeVisible && !animFrameId) doAnimate();
            });
        }, { threshold: 0 });
        threeObserver.observe(canvas);

        function doAnimate() {
            animFrameId = requestAnimationFrame(doAnimate);
            if (!isThreeVisible) { animFrameId = null; return; }
            var t = clock.getElapsedTime();

            camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
            camera.position.y += (-mouseY * 2 + 5 - camera.position.y) * 0.02;
            camera.position.z = 30 - (scrollState.threeProgress || 0) * 40;
            camera.lookAt(0, 2 - (scrollState.threeProgress || 0) * 10, -10);

            wireCubes.forEach(function(cube, idx) {
                cube.rotation.x += 0.003 + idx * 0.0005;
                cube.rotation.y += 0.005 + idx * 0.0003;
                cube.position.y += Math.sin(t + idx) * 0.003;
            });

            var pos = particles.geometry.attributes.position.array;
            for (var p = 0; p < particleCount; p++) {
                pos[p * 3 + 1] += Math.sin(t * 0.5 + p) * 0.005;
                if (pos[p * 3 + 1] > 35) pos[p * 3 + 1] = -5;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            pointLight1.intensity = 1.2 + Math.sin(t * 0.8) * 0.3;
            pointLight2.intensity = 0.6 + Math.sin(t * 1.2 + 1) * 0.2;

            renderer.render(scene, camera);
        }
        doAnimate();
    }

    /* ─── GSAP ANIMATIONS ─── */
    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        // Hero entrance
        var heroTl = gsap.timeline({ delay: 0.3 });
        heroTl
            .to('.hero__badge', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
            .to('.hero__line .text-reveal__inner', { y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15 }, '-=0.4')
            .to('.hero__sub', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2')
            .to('.hero__ctas', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
            .to('.hero__scroll', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');

        // Scroll-triggered reveals
        document.querySelectorAll('[data-anim="fade-up"]').forEach(function(el) {
            gsap.from(el, {
                opacity: 0, y: 50, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
                delay: parseFloat(el.dataset.delay) || 0,
            });
        });

        // Scale animations
        document.querySelectorAll('[data-anim="scale-x"]').forEach(function(el) {
            gsap.from(el, {
                scaleX: 0, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%' },
            });
        });

        // Hero content fade on scroll
        gsap.to('.hero__content', {
            opacity: 0, y: -80,
            scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: 1 },
        });

        // Stagger cards
        gsap.utils.toArray('.operacoes__grid, .clipes__grid, .agenda__grid').forEach(function(grid) {
            gsap.from(grid.children, {
                opacity: 0, y: 60, stagger: 0.15, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: grid, start: 'top 80%' },
            });
        });

        // Intel cards stagger
        gsap.utils.toArray('.intel__grid').forEach(function(grid) {
            gsap.from(grid.children, {
                opacity: 0, y: 40, stagger: 0.08, duration: 0.6, ease: 'power3.out',
                scrollTrigger: { trigger: grid, start: 'top 90%' },
            });
        });
    }

    /* ─── NAVIGATION ─── */
    function initNav() {
        var burger = document.getElementById('burger');
        var mobileMenu = document.getElementById('mobileMenu');
        var mobileLinks = document.querySelectorAll('.mobile-menu__link');

        burger.addEventListener('click', function() {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobileLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                burger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        document.querySelectorAll('a[href^="#"]').forEach(function(a) {
            a.addEventListener('click', function(e) {
                e.preventDefault();
                var target = document.querySelector(a.getAttribute('href'));
                if (target) {
                    if (window.lenis) {
                        window.lenis.scrollTo(target, { offset: -80 });
                    } else {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    /* ─── PROXY SYSTEM ─── */
    var CORS_PROXIES = [
        function(url) { return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url); },
        function(url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
        function(url) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url); },
    ];

    async function fetchWithFallback(url, parser) {
        for (var i = 0; i < CORS_PROXIES.length; i++) {
            try {
                var ctrl = new AbortController();
                var timer = setTimeout(function() { ctrl.abort(); }, 6000);
                var res = await fetch(CORS_PROXIES[i](url), { signal: ctrl.signal });
                clearTimeout(timer);
                if (!res.ok) continue;
                return await parser(res);
            } catch(e) { continue; }
        }
        throw new Error('All proxies failed');
    }

    /* ─── YOUTUBE + SOCIAL CARDS ─── */
    var YT_ID = 'UCBYnAv5IkSBovWPNTb9YlCA';
    var YT_RSS = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + YT_ID;

    var SOCIAL_LINKS = [
        { platform: 'TikTok', url: 'https://www.tiktok.com/@kastrusgamer', icon: 'fab fa-tiktok', color: '#25f4ee', scene: 'assets/scene-04.webp' },
        { platform: 'Instagram', url: 'https://www.instagram.com/kastrus_oficial/', icon: 'fab fa-instagram', color: '#e1306c', scene: 'assets/scene-06.webp' },
    ];

    async function initYouTube() {
        var grid = document.getElementById('ytGrid');
        if (!grid) return;

        var html = '';

        // Add social platform cards first
        SOCIAL_LINKS.forEach(function(s) {
            html += '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" class="yt-card">' +
                '<div class="yt-card__thumb">' +
                '<img src="' + s.scene + '" alt="' + s.platform + ' Kastrus" loading="lazy">' +
                '<div class="yt-card__play"><i class="' + s.icon + '" style="padding-left:0;font-size:1.5rem"></i></div>' +
                '</div>' +
                '<div class="yt-card__info">' +
                '<h4>' + s.platform + ' — @kastrus</h4>' +
                '<p>Siga para conteúdos exclusivos</p>' +
                '</div></a>';
        });

        // Then fetch YouTube videos
        try {
            var data = await fetchWithFallback(YT_RSS, async function(res) {
                var ct = res.headers.get('content-type') || '';
                if (ct.includes('json')) {
                    var j = await res.json();
                    return j.items || [];
                }
                var text = await res.text();
                var xml = new DOMParser().parseFromString(text, 'text/xml');
                var entries = xml.querySelectorAll('entry');
                return Array.from(entries).map(function(e) {
                    return {
                        title: e.querySelector('title').textContent || '',
                        link: e.querySelector('link').getAttribute('href') || e.querySelector('link').textContent || '',
                        thumbnail: (e.querySelector('media\\:thumbnail') || e.querySelector('thumbnail')).getAttribute('url') || '',
                        pubDate: e.querySelector('published').textContent || ''
                    };
                });
            });

            if (!data.length) throw new Error('No videos');

            var videos = data.map(function(item) {
                return {
                    id: (item.link || '').match(/v=([a-zA-Z0-9_-]{11})/)?.[1] || '',
                    title: item.title || '',
                    thumb: item.thumbnail || '',
                    views: '0',
                    published: item.pubDate || ''
                };
            }).filter(function(v) { return v.id; });

            var picked = videos.sort(function() { return Math.random() - 0.5; }).slice(0, 4);

            html += picked.map(function(v) {
                return '<a href="https://www.youtube.com/watch?v=' + v.id + '" target="_blank" rel="noopener noreferrer" class="yt-card">' +
                    '<div class="yt-card__thumb">' +
                    '<img src="' + v.thumb + '" alt="' + v.title + '" loading="lazy" onerror="this.src=\'assets/scene-03.webp\'">' +
                    '<div class="yt-card__play"><i class="fas fa-play"></i></div>' +
                    '<div class="yt-card__views"><i class="fas fa-eye"></i> ' + fmtV(v.views) + '</div>' +
                    '</div>' +
                    '<div class="yt-card__info">' +
                    '<h4>' + (v.title.length > 55 ? v.title.substring(0,55)+'...' : v.title) + '</h4>' +
                    '<p>' + ago(v.published) + '</p>' +
                    '</div></a>';
            }).join('');
        } catch(e) {
            // YouTube fallback — show 3 random scene cards
            var scenes = ['assets/scene-02.webp','assets/scene-03.webp','assets/scene-05.webp'];
            html += scenes.map(function(s, i) {
                return '<a href="https://www.youtube.com/@KastrusGamer" target="_blank" rel="noopener noreferrer" class="yt-card">' +
                    '<div class="yt-card__thumb">' +
                    '<img src="' + s + '" alt="Kastrus YouTube" loading="lazy">' +
                    '<div class="yt-card__play"><i class="fas fa-play"></i></div>' +
                    '</div>' +
                    '<div class="yt-card__info"><h4>Ver no canal</h4><p>Inscreva-se</p></div></a>';
            }).join('');
        }

        grid.innerHTML = html;
    }

    function fmtV(v) { var n=parseInt(v); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n; }
    function ago(d) {
        var s=(Date.now()-new Date(d).getTime())/1000;
        if(s<60)return'Agora';if(s<3600)return Math.floor(s/60)+'min';if(s<86400)return Math.floor(s/3600)+'h';
        if(s<2592000)return Math.floor(s/86400)+'d';if(s<31536000)return Math.floor(s/2592000)+'m';return Math.floor(s/31536000)+'a';
    }

    /* ─── FORM (SINGLE HANDLER) ─── */
    function initFormInteractions() {
        var form = document.getElementById('contactForm');
        if (!form) return;

        // Create success overlay
        var successDiv = document.createElement('div');
        successDiv.className = 'form__success';
        successDiv.innerHTML = '<span class="form__success-text">✓ MENSAGEM TRANSMITIDA</span>';
        form.style.position = 'relative';
        form.appendChild(successDiv);

        // Single submit handler
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = form.querySelector('.cta');
            var txt = btn.querySelector('.cta__text');
            var orig = txt.innerHTML;
            txt.innerHTML = '<span>TRANSMITINDO...</span>';
            btn.disabled = true;

            setTimeout(function() {
                successDiv.classList.add('active');
                txt.innerHTML = orig;
                btn.disabled = false;
                form.reset();

                setTimeout(function() {
                    successDiv.classList.remove('active');
                }, 2500);
            }, 1500);
        });

        // Focus micro-interactions via CSS only (no JS duplication)
    }

    /* ─── INTELLIGENCE FEED ─── */
    var INTEL_FEEDS = [
        { name: 'TecMundo', url: 'https://www.tecmundo.com.br/rss', cat: 'Tecnologia' },
        { name: 'Canaltech', url: 'https://canaltech.com.br/rss', cat: 'Inovação' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', cat: 'Tech' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', cat: 'Startups' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', cat: 'Ciência' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', cat: 'Cultura Tech' },
    ];
    var CACHE_KEY = 'kr_intel_cache';
    var CACHE_TTL = 86400000;
    var allArticles = [];
    var displayedCount = 0;
    var PER_PAGE = 9;

    function initIntelFeed() {
        var cached = loadCache();
        if (cached) {
            allArticles = cached;
            renderIntelFeed();
            return;
        }
        fetchAllFeeds();
    }

    function loadCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (Date.now() - data.ts > CACHE_TTL) return null;
            return data.articles;
        } catch (e) { return null; }
    }

    function saveCache(articles) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), articles: articles })); } catch (e) {}
    }

    async function fetchAllFeeds() {
        var loading = document.getElementById('intelLoading');
        var promises = INTEL_FEEDS.map(function(feed) { return fetchFeed(feed); });
        var results = await Promise.allSettled(promises);
        var articles = [];
        results.forEach(function(r) {
            if (r.status === 'fulfilled' && r.value) articles.push.apply(articles, r.value);
        });

        articles.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

        var seen = new Set();
        allArticles = articles.filter(function(a) {
            var key = a.title.substring(0, 40).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        saveCache(allArticles);
        if (loading) loading.style.display = 'none';
        renderIntelFeed();
    }

    async function fetchFeed(feed) {
        try {
            return await fetchWithFallback(feed.url, async function(res) {
                var ct = res.headers.get('content-type') || '';
                var items = [];

                if (ct.includes('json')) {
                    var data = await res.json();
                    items = data.items || [];
                    return items.slice(0, 10).map(function(item) {
                        var desc = cleanHtml(item.description || item.summary || item.content || '');
                        return {
                            title: item.title || '', link: item.link || '#', desc: desc,
                            date: item.pubDate || item.published || item.updated || '',
                            img: item.thumbnail || (item.enclosure && item.enclosure.link) || extractImageFromDesc(item.description || ''),
                            source: feed.name, category: feed.cat,
                            readTime: Math.max(2, Math.ceil(desc.split(' ').length / 200)) + ' min',
                        };
                    }).filter(function(a) { return a.title && a.title.length > 5; });
                }

                var text = await res.text();
                var xml = new DOMParser().parseFromString(text, 'text/xml');
                items = xml.querySelectorAll('item');
                if (!items.length) items = xml.querySelectorAll('entry');

                return Array.from(items).slice(0, 10).map(function(item) {
                    var title = (item.querySelector('title') || {}).textContent || '';
                    var link = (item.querySelector('link') || {}).getAttribute('href') || (item.querySelector('link') || {}).textContent || '#';
                    var desc = cleanHtml((item.querySelector('description') || {}).textContent || (item.querySelector('summary') || {}).textContent || (item.querySelector('content') || {}).textContent || '');
                    var date = (item.querySelector('pubDate') || {}).textContent || (item.querySelector('published') || {}).textContent || '';
                    var media = item.querySelector('media\\:thumbnail') || item.querySelector('thumbnail') || item.querySelector('media\\:content');
                    var img = (media && media.getAttribute('url')) || extractImageFromDesc((item.querySelector('description') || {}).textContent || '');

                    return {
                        title: title, link: link, desc: desc, date: date, img: img,
                        source: feed.name, category: feed.cat,
                        readTime: Math.max(2, Math.ceil(desc.split(' ').length / 200)) + ' min',
                    };
                }).filter(function(a) { return a.title && a.title.length > 5; });
            });
        } catch (e) {
            console.warn('Feed error [' + feed.name + ']:', e);
            return [];
        }
    }

    function extractImageFromDesc(html) {
        var match = html.match(/<img[^>]+src=["']([^"']+)["']/);
        return match ? match[1] : '';
    }

    function cleanHtml(html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return (tmp.textContent || '').trim().substring(0, 200) || '';
    }

    function renderIntelFeed() {
        if (!allArticles.length) {
            document.getElementById('intelLoading').innerHTML =
                '<span style="color:var(--text2)">NENHUMA INTELIGÊNCIA DISPONÍVEL</span>';
            return;
        }

        var timeEl = document.getElementById('intelTime');
        if (timeEl) timeEl.textContent = new Date().toLocaleString('pt-BR');

        var feat = allArticles[0];
        document.getElementById('intelFeatured').style.display = 'block';
        var featImg = document.getElementById('featImg');
        if (feat.img) {
            featImg.src = feat.img;
            featImg.onerror = function() {
                featImg.src = 'assets/scene-01.webp';
                featImg.className = 'intel-card__img-fallback';
            };
        } else {
            featImg.src = 'assets/scene-01.webp';
            featImg.className = 'intel-card__img-fallback';
        }
        document.getElementById('featCat').textContent = feat.category;
        document.getElementById('featSource').textContent = feat.source;
        document.getElementById('featDate').textContent = formatDate(feat.date);
        document.getElementById('featRead').textContent = feat.readTime + ' leitura';
        document.getElementById('featTitle').textContent = feat.title;
        document.getElementById('featDesc').textContent = feat.desc;
        document.getElementById('featLink').href = feat.link;

        displayedCount = PER_PAGE;
        renderGrid();

        var loadMore = document.getElementById('intelLoadMore');
        loadMore.addEventListener('click', function() {
            displayedCount += PER_PAGE;
            renderGrid();
        });

        updateCount();
    }

    function renderGrid() {
        var grid = document.getElementById('intelGrid');
        var slice = allArticles.slice(1, displayedCount);

        grid.innerHTML = slice.map(function(a) {
            return '<a href="' + a.link + '" target="_blank" rel="noopener noreferrer" class="intel-card">' +
                '<div class="intel-card__thumb">' +
                (a.img
                    ? '<img src="' + a.img + '" alt="' + a.title + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'">'
                    : '<div style="width:100%;height:100%;background:var(--detail);display:flex;align-items:center;justify-content:center"><i class="fas fa-microchip" style="font-size:2rem;color:var(--orange);opacity:0.3"></i></div>'
                ) +
                '<div class="intel-card__thumb-overlay"></div>' +
                '<span class="intel-card__cat">' + a.category + '</span>' +
                '</div>' +
                '<div class="intel-card__content">' +
                '<div class="intel-card__meta">' +
                '<span class="intel-card__source">' + a.source + '</span>' +
                '<span class="intel-card__date">' + formatDate(a.date) + '</span>' +
                '<span class="intel-card__read">' + a.readTime + '</span>' +
                '</div>' +
                '<h4 class="intel-card__title">' + a.title + '</h4>' +
                '<p class="intel-card__desc">' + a.desc + '</p>' +
                '</div></a>';
        }).join('');

        updateCount();
    }

    function updateCount() {
        var el = document.getElementById('intelCount');
        var showing = Math.min(displayedCount, allArticles.length);
        el.textContent = showing + ' DE ' + allArticles.length + ' RELATÓRIOS';
        var btn = document.getElementById('intelLoadMore');
        btn.style.display = displayedCount >= allArticles.length ? 'none' : '';
    }

    function formatDate(d) {
        if (!d) return '';
        try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch (e) { return d; }
    }

    /* ─── CUSTOM CURSOR ─── */
    function initCursor() {
        var cursor = document.getElementById('cursor');
        var dot = document.getElementById('cursorDot');
        if (!cursor || !dot || isMobile || window.matchMedia('(pointer: coarses)').matches) return;

        // Hide native cursor on desktop
        document.body.classList.add('has-custom-cursor');

        var mouseX = 0, mouseY = 0;
        var cursorX = 0, cursorY = 0;
        var dotX = 0, dotY = 0;

        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.12;
            cursorY += (mouseY - cursorY) * 0.12;
            dotX += (mouseX - dotX) * 0.25;
            dotY += (mouseY - dotY) * 0.25;

            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            dot.style.left = dotX + 'px';
            dot.style.top = dotY + 'px';

            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Dynamic cursor states
        var links = document.querySelectorAll('a, button');
        links.forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                cursor.className = 'cursor cursor--link';
            });
            el.addEventListener('mouseleave', function() {
                cursor.className = 'cursor';
            });
        });

        var cards = document.querySelectorAll('.op-card, .clip-panel, .sch-card, .intel-card, .yt-card');
        cards.forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                cursor.className = 'cursor cursor--card';
            });
            el.addEventListener('mouseleave', function() {
                cursor.className = 'cursor';
            });
        });

        var images = document.querySelectorAll('.cinematic__img, .intel-card__img img, .yt-card__thumb img');
        images.forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                cursor.className = 'cursor cursor--image';
            });
            el.addEventListener('mouseleave', function() {
                cursor.className = 'cursor';
            });
        });

        var textFields = document.querySelectorAll('input, textarea, .hero__line, .hero__title, .about__title, .live__title, .clipes__title, .arquivo__title, .operacoes__title, .agenda__title, .intel__title, .contato__title');
        textFields.forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                cursor.className = 'cursor cursor--text';
            });
            el.addEventListener('mouseleave', function() {
                cursor.className = 'cursor';
            });
        });

        // Click state
        document.addEventListener('mousedown', function() { cursor.classList.add('cursor--click'); });
        document.addEventListener('mouseup', function() { cursor.classList.remove('cursor--click'); });
    }

    /* ─── MAGNETIC BUTTONS ─── */
    function initMagneticButtons() {
        if (isMobile || window.matchMedia('(pointer: coarses)').matches) return;

        document.querySelectorAll('.magnetic').forEach(function(btn) {
            btn.addEventListener('mousemove', function(e) {
                var rect = btn.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px)';
            });

            btn.addEventListener('mouseleave', function() {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

    /* ─── TEXT REVEAL ─── */
    function initTextReveal() {
        // Hero lines — simple wrap
        document.querySelectorAll('.hero__line').forEach(function(line) {
            var text = line.innerHTML;
            line.innerHTML = '<span class="text-reveal"><span class="text-reveal__inner">' + text + '</span></span>';
        });

        // Section titles — wrap entire title content
        document.querySelectorAll('.about__title, .live__title, .clipes__title, .arquivo__title, .operacoes__title, .agenda__title, .intel__title, .contato__title').forEach(function(title) {
            // Skip if already wrapped
            if (title.querySelector('.text-reveal')) return;
            var html = title.innerHTML;
            title.innerHTML = '<span class="text-reveal"><span class="text-reveal__inner">' + html + '</span></span>';
        });

        // Observe and reveal on scroll
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.text-reveal').forEach(function(el) {
            observer.observe(el);
        });

        // Mark hero lines as revealed immediately
        document.querySelectorAll('.hero__line .text-reveal').forEach(function(el) {
            el.classList.add('revealed');
        });
    }

    /* ─── 3D TILT ON CARDS ─── */
    function init3DTilt() {
        if (isMobile || window.matchMedia('(pointer: coarses)').matches) return;

        var tiltCards = document.querySelectorAll('.op-card, .clip-panel, .sch-card');
        tiltCards.forEach(function(card) {
            card.addEventListener('mousemove', function(e) {
                var rect = card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width;
                var y = (e.clientY - rect.top) / rect.height;
                var tiltX = (0.5 - y) * 12;
                var tiltY = (x - 0.5) * 12;
                var glareX = x * 100;
                var glareY = y * 100;

                card.style.transform = 'perspective(800px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateY(-8px) scale(1.02)';
                card.style.setProperty('--glare-x', glareX + '%');
                card.style.setProperty('--glare-y', glareY + '%');
                card.classList.add('tilt-active');
            });

            card.addEventListener('mouseleave', function() {
                card.style.transform = '';
                card.classList.remove('tilt-active');
            });
        });
    }

})();

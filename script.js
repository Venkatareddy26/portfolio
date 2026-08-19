/**
 * Premium 3D Interactive Portfolio — 2026 Edition
 * Three.js background, custom cursor, scrollspy, tilt cards,
 * reveal animations and micro-interactions.
 */
(function () {
    'use strict';

    // ============================================
    // Environment flags
    // ============================================
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var isMobile = function () { return window.innerWidth < 768; };

    document.documentElement.classList.add('js');

    function webglAvailable() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    // ============================================
    // Three.js 3D Background
    // ============================================
    function initThreeBackground() {
        if (prefersReducedMotion || !webglAvailable() || !window.THREE) {
            document.body.classList.add('no-webgl');
            return;
        }

        var canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        var scene, camera, renderer, particles, geometries;
        var particleGeometry, particleCount, velocities;

        try {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: false,
                powerPreference: 'low-power'
            });
        } catch (e) {
            document.body.classList.add('no-webgl');
            return;
        }

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        // Particle field
        particleCount = isMobile() ? 70 : 150;
        velocities = [];
        var positions = new Float32Array(particleCount * 3);
        var sizes = new Float32Array(particleCount);

        for (var i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 32;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 32;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
            velocities.push({
                x: (Math.random() - 0.5) * 0.004,
                y: (Math.random() - 0.5) * 0.004,
                z: (Math.random() - 0.5) * 0.003
            });
            sizes[i] = Math.random() * 2 + 0.6;
        }

        particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        var particleMaterial = new THREE.PointsMaterial({
            color: 0x818cf8,
            size: 0.07,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });

        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Floating wireframe geometry
        geometries = [];
        var baseMaterial = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            wireframe: true,
            transparent: true,
            opacity: 0.055,
            depthWrite: false
        });

        var ico = new THREE.Mesh(
            new THREE.IcosahedronGeometry(2.6, 1),
            baseMaterial.clone()
        );
        ico.position.set(7, -3, -6);
        scene.add(ico);
        geometries.push({ mesh: ico, rx: 0.002, ry: 0.003, rz: 0.001 });

        if (!isMobile()) {
            var oct = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.9, 0),
                new THREE.MeshBasicMaterial({
                    color: 0xa855f7,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.05,
                    depthWrite: false
                })
            );
            oct.position.set(-8, 4, -5);
            scene.add(oct);
            geometries.push({ mesh: oct, rx: 0.003, ry: 0.002, rz: 0.002 });

            var torus = new THREE.Mesh(
                new THREE.TorusGeometry(1.6, 0.42, 12, 24),
                new THREE.MeshBasicMaterial({
                    color: 0x22d3ee,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.04,
                    depthWrite: false
                })
            );
            torus.position.set(-4, -5, -7);
            scene.add(torus);
            geometries.push({ mesh: torus, rx: 0.001, ry: 0.004, rz: 0.001 });
        }

        // Interaction state
        var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
        var scrollOffset = 0;

        document.addEventListener('mousemove', function (e) {
            targetX = (e.clientX / window.innerWidth - 0.5) * 2;
            targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });

        window.addEventListener('scroll', function () {
            scrollOffset = window.pageYOffset;
        }, { passive: true });

        var animationId;

        function animate() {
            animationId = requestAnimationFrame(animate);

            mouseX += (targetX - mouseX) * 0.025;
            mouseY += (targetY - mouseY) * 0.025;

            // Update particles
            var posArray = particleGeometry.attributes.position.array;
            for (var p = 0; p < particleCount; p++) {
                posArray[p * 3] += velocities[p].x;
                posArray[p * 3 + 1] += velocities[p].y;
                posArray[p * 3 + 2] += velocities[p].z;

                if (posArray[p * 3] > 16) posArray[p * 3] = -16;
                if (posArray[p * 3] < -16) posArray[p * 3] = 16;
                if (posArray[p * 3 + 1] > 16) posArray[p * 3 + 1] = -16;
                if (posArray[p * 3 + 1] < -16) posArray[p * 3 + 1] = 16;
            }
            particleGeometry.attributes.position.needsUpdate = true;

            // Rotate floating geometry
            for (var g = 0; g < geometries.length; g++) {
                var geo = geometries[g];
                geo.mesh.rotation.x += geo.rx;
                geo.mesh.rotation.y += geo.ry;
                geo.mesh.rotation.z += geo.rz;
            }

            // Camera reacts to mouse + scroll
            camera.position.x = mouseX * 0.6;
            camera.position.y = -mouseY * 0.4 - scrollOffset * 0.0008;
            camera.lookAt(0, -scrollOffset * 0.0008, 0);

            renderer.render(scene, camera);
        }

        animate();

        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else {
                animate();
            }
        });
    }

    // ============================================
    // Custom Cursor (desktop only)
    // ============================================
    function initCustomCursor() {
        if (isTouchDevice || prefersReducedMotion) return;

        var dot = document.getElementById('cursorDot');
        var ring = document.getElementById('cursorRing');
        if (!dot || !ring) return;

        var mouseX = -100, mouseY = -100;
        var ringX = -100, ringY = -100;
        var visible = false;

        window.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!visible) {
                visible = true;
                dot.style.opacity = '1';
                ring.style.opacity = '1';
                document.body.classList.add('cursor-on');
            }
        }, { passive: true });

        document.addEventListener('mouseleave', function () {
            visible = false;
            document.body.classList.remove('cursor-on');
            dot.style.opacity = '0';
            ring.style.opacity = '0';
        });

        // Hover expansion on interactive elements
        var interactiveSelector = 'a, button, .project-card, .skill-category, .contact-card, .info-item, .timeline-content, .social-links a';
        document.addEventListener('mouseover', function (e) {
            if (e.target.closest && e.target.closest(interactiveSelector)) {
                document.body.classList.add('cursor-hover');
            }
        });
        document.addEventListener('mouseout', function (e) {
            if (e.target.closest && e.target.closest(interactiveSelector)) {
                document.body.classList.remove('cursor-hover');
            }
        });

        (function cursorLoop() {
            requestAnimationFrame(cursorLoop);
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
            ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
        })();
    }

    // ============================================
    // Mobile Menu
    // ============================================
    function initMobileMenu() {
        var btn = document.getElementById('mobileMenuBtn');
        var navLinks = document.getElementById('navLinks');
        if (!btn || !navLinks) return;

        function closeMenu() {
            btn.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        }

        btn.addEventListener('click', function () {
            var open = navLinks.classList.toggle('active');
            btn.classList.toggle('active', open);
            document.body.classList.toggle('menu-open', open);
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                var navbar = document.querySelector('.navbar');
                var navHeight = navbar ? navbar.offsetHeight : 0;
                var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 24;
                window.scrollTo({
                    top: targetPosition,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            });
        });
    }

    // ============================================
    // Navbar Scroll State + Scrollspy
    // ============================================
    function initNavbarScroll() {
        var navbar = document.getElementById('navbar');
        if (!navbar) return;

        var scrollIndicator = document.querySelector('.scroll-indicator');

        window.addEventListener('scroll', function () {
            var y = window.pageYOffset;
            navbar.classList.toggle('scrolled', y > 24);

            if (scrollIndicator) {
                scrollIndicator.classList.toggle('hidden', y > 90);
            }
        }, { passive: true });

        // Active section indicator
        var sections = document.querySelectorAll('section[id]');
        var links = document.querySelectorAll('.nav-link');

        if ('IntersectionObserver' in window && !prefersReducedMotion) {
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var id = entry.target.id;
                        links.forEach(function (link) {
                            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                        });
                    }
                });
            }, { rootMargin: '-40% 0px -55% 0px' });

            sections.forEach(function (s) { spy.observe(s); });
        }
    }

    // ============================================
    // Scroll Progress Bar
    // ============================================
    function initScrollProgress() {
        var bar = document.getElementById('scrollProgress');
        if (!bar) return;

        window.addEventListener('scroll', function () {
            var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            var scrolled = docHeight > 0 ? (window.pageYOffset / docHeight) * 100 : 0;
            bar.style.width = scrolled + '%';
        }, { passive: true });
    }

    // ============================================
    // Scroll Reveal Animations
    // ============================================
    function initScrollReveal() {
        var els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        // Stagger items within the same parent group
        els.forEach(function (el) {
            var parent = el.parentElement;
            if (!parent) return;
            var siblings = Array.prototype.filter.call(parent.children, function (c) {
                return c.classList.contains('reveal') ||
                    c.classList.contains('reveal-left') ||
                    c.classList.contains('reveal-right');
            });
            var index = siblings.indexOf(el);
            if (index >= 0) {
                el.style.setProperty('--d', (index * 0.09).toFixed(2) + 's');
            }
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

        els.forEach(function (el) { observer.observe(el); });
    }

    // ============================================
    // Typing Animation for Hero Subtitle
    // ============================================
    function initTypingAnimation() {
        if (prefersReducedMotion) return;

        var subtitle = document.querySelector('.hero-subtitle');
        if (!subtitle) return;

        var text = subtitle.textContent;
        subtitle.textContent = '';
        subtitle.style.borderRight = '2px solid #a78bfa';
        subtitle.style.display = 'inline-block';
        subtitle.style.paddingRight = '6px';

        var i = 0;
        var typeWriter = function () {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 55);
            } else {
                setTimeout(function () {
                    subtitle.style.borderRight = 'none';
                    subtitle.style.paddingRight = '0';
                }, 1600);
            }
        };

        setTimeout(typeWriter, 900);
    }

    // ============================================
    // 3D Tilt + Spotlight for Cards
    // ============================================
    function initTilt() {
        if (prefersReducedMotion) return;

        document.querySelectorAll('[data-tilt]').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var rect = el.getBoundingClientRect();
                var px = (e.clientX - rect.left) / rect.width;
                var py = (e.clientY - rect.top) / rect.height;

                var rx = (0.5 - py) * 7;
                var ry = (px - 0.5) * 9;

                el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
                el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
                el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            });

            el.addEventListener('mouseleave', function () {
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });
    }

    // ============================================
    // Magnetic Buttons (desktop only)
    // ============================================
    function initMagneticButtons() {
        if (isTouchDevice || prefersReducedMotion) return;

        document.querySelectorAll('.hero-buttons a, .nav-resume, .social-links a').forEach(function (btn) {
            btn.addEventListener('mousemove', function (e) {
                var rect = btn.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = 'translate(' + (x * 0.16).toFixed(1) + 'px,' + (y * 0.28).toFixed(1) + 'px)';
            });

            btn.addEventListener('mouseleave', function () {
                btn.style.transform = '';
            });
        });
    }

    // ============================================
    // Subtle Parallax (About visual)
    // ============================================
    function initParallax() {
        if (prefersReducedMotion || isTouchDevice) return;

        var profileCard = document.getElementById('profileCard');
        if (!profileCard) return;

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var rect = profileCard.getBoundingClientRect();
                var center = rect.top + rect.height / 2 - window.innerHeight / 2;
                var offset = Math.max(-60, Math.min(60, center * -0.06));
                profileCard.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
                ticking = false;
            });
        }, { passive: true });
    }

    // ============================================
    // Initialize Everything
    // ============================================
    document.addEventListener('DOMContentLoaded', function () {
        initThreeBackground();
        initCustomCursor();
        initMobileMenu();
        initSmoothScroll();
        initNavbarScroll();
        initScrollProgress();
        initScrollReveal();
        initTypingAnimation();
        initTilt();
        initMagneticButtons();
        initParallax();
    });
})();

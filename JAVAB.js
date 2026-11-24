// Variables globales
let isPlaying = false;
let currentSlide = 0;
let totalSlides = 0;

/* Música de fondo (musica.mp3) — mismo método que la invitación Winter.
   Safari / iPhone solo dejan sonar audio si play() se llama DIRECTAMENTE
   dentro del toque del usuario, sin esperas antes. */
function getAudio() { return document.getElementById('bgMusic'); }

function playMusic() {
    const audio = getAudio();
    if (!audio) return;
    audio.muted = false;
    const p = audio.play();               // síncrono, dentro del gesto del usuario
    isPlaying = true;
    updateMusicIcon();
    if (p && typeof p.catch === 'function') {
        p.catch(() => { isPlaying = false; updateMusicIcon(); });
    }
}

function pauseMusic() {
    const audio = getAudio();
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    updateMusicIcon();
}

function showMusicButton() {
    const musicPlayer = document.getElementById('musicPlayer');
    if (musicPlayer) musicPlayer.style.display = 'block';
}

function hideWelcome() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'none';
}

function enterWithMusicClick() {
    playMusic();          // primero el audio, para que Safari lo permita
    showMusicButton();
    hideWelcome();
}

function enterWithoutMusicClick() {
    showMusicButton();
    updateMusicIcon();
    hideWelcome();
}

function toggleMusic() {
    if (isPlaying) pauseMusic(); else playMusic();
}

let resumeOnReturn = false;
document.addEventListener('visibilitychange', () => {
    const audio = getAudio();
    if (!audio) return;
    if (document.hidden) {
        resumeOnReturn = isPlaying;
        if (isPlaying) audio.pause();
    } else if (resumeOnReturn) {
        audio.play().catch(() => { isPlaying = false; updateMusicIcon(); });
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializeCarousel();

    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) musicToggle.addEventListener('click', toggleMusic);


    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'flex';
});

function updateMusicIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (volumeIcon) {
        if (isPlaying) {
            volumeIcon.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#FBF8F2"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#E6CF8F" stroke-width="2" stroke-linecap="round"></path>
            `;
        } else {
            volumeIcon.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#FBF8F2"></polygon>
                <line x1="16" y1="9" x2="22" y2="15" stroke="#E6CF8F" stroke-width="2" stroke-linecap="round"></line>
                <line x1="22" y1="9" x2="16" y2="15" stroke="#E6CF8F" stroke-width="2" stroke-linecap="round"></line>
            `;
        }
    }
}

// Countdown
function initializeCountdown() {
    const targetDate = new Date('2027-08-14T15:30:00-04:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Carrusel 3D (coverflow): la foto del centro grande y las de los lados asomadas
let carouselTimer = null;

function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    totalSlides = items.length;
    if (!totalSlides) return;

    // Puntitos
    const dots = document.getElementById('carouselDots');
    if (dots) {
        dots.innerHTML = '';
        items.forEach((_, i) => {
            const d = document.createElement('button');
            d.type = 'button';
            d.addEventListener('click', () => goToSlide(i));
            dots.appendChild(d);
        });
    }

    // Tocar una foto de un lado la trae al centro
    items.forEach((it, i) => it.addEventListener('click', () => {
        if (i !== currentSlide) goToSlide(i);
    }));

    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));

    // Deslizar con el dedo
    let startX = 0, startY = 0, touching = false;
    track.addEventListener('touchstart', e => {
        touching = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    track.addEventListener('touchend', e => {
        if (!touching) return;
        touching = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            goToSlide(currentSlide + (dx < 0 ? 1 : -1));
        }
    }, { passive: true });

    updateCarousel();
    startCarouselAutoplay();
}

function startCarouselAutoplay() {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => goToSlide(currentSlide + 1, true), 3000);
}

function goToSlide(index, fromAutoplay) {
    if (!totalSlides) return;
    currentSlide = (index % totalSlides + totalSlides) % totalSlides;
    updateCarousel();
    if (!fromAutoplay) startCarouselAutoplay(); // reinicia el tiempo al tocar
}

function nextSlide() { goToSlide(currentSlide + 1); }
function previousSlide() { goToSlide(currentSlide - 1); }

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const items = track.querySelectorAll('.carousel-item');
    const n = items.length;
    items.forEach((it, i) => {
        it.classList.remove('is-active', 'is-prev', 'is-next');
        if (i === currentSlide) it.classList.add('is-active');
        else if (n > 1 && i === (currentSlide - 1 + n) % n) it.classList.add('is-prev');
        else if (n > 2 && i === (currentSlide + 1) % n) it.classList.add('is-next');
    });
    const dots = document.querySelectorAll('#carouselDots button');
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    updateSlideCounter();
}

function updateSlideCounter() {
    const currentSlideElement = document.getElementById('currentSlide');
    const totalSlidesElement = document.getElementById('totalSlides');
    if (currentSlideElement) currentSlideElement.textContent = (currentSlide + 1);
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;
}

// Funciones de los botones
function openLocation(location) {
    // Plantilla de ejemplo: aquí va el enlace de Google Maps de cada lugar
    showToast('Aquí va esto', location === 'ceremony'
        ? 'Aquí va la ubicación de la iglesia.'
        : 'Aquí va la ubicación del salón de la fiesta.');
}

// NOTA: esta es una plantilla de ejemplo. Reemplaza el contenido de estas
// funciones con tu propio enlace (Google Drive, Google Form, lista de
// regalos, etc.) cuando personalices la invitación.

function sharePhotos() {
    // Plantilla de ejemplo: aquí va el enlace del álbum para compartir fotos.
    showToast('Aquí va esto', 'Aquí va el enlace para subir y compartir tus fotos.');
}

function showDressCode() {
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeDressCodeModal() {
    // El click dentro de la tarjeta del modal usa stopPropagation(), así que
    // esta función solo se dispara al hacer click en el fondo oscuro o en la X.
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showGifts() {
    const modal = document.getElementById('giftsModal');
    if (modal) modal.style.display = 'flex';
}

function closeGiftsModal() {
    const modal = document.getElementById('giftsModal');
    if (modal) modal.style.display = 'none';
}

const CHECK_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

function copyText(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    const value = el.textContent.trim();
    const original = btn ? btn.innerHTML : '';
    const done = () => {
        if (!btn) return;
        btn.innerHTML = CHECK_SVG;
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 1600);
    };
    const fallback = () => {
        const t = document.createElement('textarea');
        t.value = value;
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(t);
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done).catch(fallback);
    } else {
        fallback();
    }
}

function confirmAttendance() {
    // Plantilla de ejemplo: aquí va el enlace de WhatsApp o del formulario de confirmación.
    showToast('Aquí va esto', 'Aquí va el enlace de WhatsApp para confirmar tu asistencia.');
}

// Sistema de Toast
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.innerHTML = `
        <h4 style="font-weight: 700; color: #E6CF8F; margin-bottom: 0.35rem; letter-spacing: 0.2px;">${title}</h4>
        <p style="color: #ddd;">${message}</p>
    `;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Nota: el efecto de portada ahora se logra 100% con CSS (hero fijo detrás
// del contenido, ver .hero-section y .content en CCSB.css), igual que en
// boda100L. Ya no hace falta mover nada por JS en el scroll.


// Forzar limpieza de caches en clientes antiguos
(function() {
  function clearCaches() {
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      }).catch(() => {});
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearCaches);
  } else {
    clearCaches();
  }
})();

// Estrellas que brillan en el fondo
(function () {
    function addStars(container, count, opts) {
        if (!container) return;
        opts = opts || {};
        for (let i = 0; i < count; i++) {
            const s = document.createElement('span');
            s.className = 'twinkle-star' + (Math.random() < (opts.gold || 0.25) ? ' gold' : '');
            s.style.left = (Math.random() * 96 + 2) + '%';
            s.style.top = (Math.random() * 96 + 2) + '%';
            s.style.setProperty('--s', (8 + Math.random() * (opts.max || 14)) + 'px');
            s.style.setProperty('--d', (2.2 + Math.random() * 3) + 's');
            s.style.setProperty('--delay', (Math.random() * 5) + 's');
            container.appendChild(s);
        }
    }
    function init() {
        const content = document.querySelector('.content');
        // cantidad proporcional al alto de la página
        if (content) addStars(content, Math.round(content.scrollHeight / 160), { max: 14 });
        addStars(document.getElementById('welcomeModal'), 18, { max: 16, gold: 0.35 });
        addStars(document.querySelector('.footer'), 12, { max: 12, gold: 0.4 });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

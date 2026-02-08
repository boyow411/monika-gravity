/**
 * Gallery.js — Lightbox for gallery images
 */

const grid = document.getElementById('gallery-grid');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCounter = document.getElementById('lightbox-counter');
const closeBtn = document.getElementById('lightbox-close');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');

let currentIndex = 0;
let images = [];

function init() {
    if (!grid || !lightbox) return;

    images = Array.from(grid.querySelectorAll('.gallery-item img'));

    grid.querySelectorAll('.gallery-item').forEach((item, i) => {
        item.addEventListener('click', () => openLightbox(i));
    });

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => navigate(-1));
    nextBtn?.addEventListener('click', () => navigate(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });
}

function openLightbox(index) {
    currentIndex = index;
    updateImage();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
}

function navigate(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    updateImage();
}

function updateImage() {
    lightboxImage.src = images[currentIndex].src;
    lightboxImage.alt = images[currentIndex].alt;
    lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`;
}

document.addEventListener('DOMContentLoaded', init);

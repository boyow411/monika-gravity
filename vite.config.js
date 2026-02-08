import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        venue: resolve(__dirname, 'venue.html'),
        story: resolve(__dirname, 'story.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        'private-hire': resolve(__dirname, 'private-hire.html'),
        contact: resolve(__dirname, 'contact.html'),
        faqs: resolve(__dirname, 'faqs.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

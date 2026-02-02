import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// Skip image optimization in Docker builds (sharp not available)
const skipImageOptimization = process.env.VITE_SKIP_IMAGE_OPTIMIZATION === 'true';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Optimize build for production
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libs - smallest critical chunk
          "vendor-react": ["react", "react-dom"],
          // Router separate for better caching
          "vendor-router": ["react-router-dom"],
          // UI components - split into smaller chunks
          "vendor-ui-dialog": ["@radix-ui/react-dialog", "@radix-ui/react-alert-dialog"],
          "vendor-ui-menu": ["@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-select"],
          "vendor-ui-base": ["@radix-ui/react-tabs", "@radix-ui/react-tooltip", "@radix-ui/react-checkbox"],
          // Charts - only load when needed
          "vendor-charts": ["recharts"],
          // Query
          "vendor-query": ["@tanstack/react-query"],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          // Animation - often not needed immediately
          "vendor-animation": ["framer-motion"],
          // Icons - separate for tree-shaking
          "vendor-icons": ["lucide-react"],
        },
      },
    },
    // Chunk size warning
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Only include image optimizer when not in Docker build
    !skipImageOptimization && ViteImageOptimizer({
      // Optimize existing formats
      jpg: {
        quality: 85,
      },
      jpeg: {
        quality: 85,
      },
      png: {
        quality: 85,
        compressionLevel: 9,
      },
      // WebP output settings
      webp: {
        quality: 85,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        effort: 4,
      },
      // Enable caching for faster rebuilds
      cache: true,
      cacheLocation: 'node_modules/.cache/image-optimizer',
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "La Casa Dark CORE",
        short_name: "Dark Core",
        description: "Ferramenta definitiva para criadores de canal dark no YouTube",
        theme_color: "#22c55e",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/*.gif", "**/logo*.gif"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize deps
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js"
    ],
  },
}));

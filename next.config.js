/** @type {import('next').NextConfig} */

// Suppress Node.js deprecation warnings
if (process.env.NODE_ENV === 'development') {
  process.removeAllListeners('warning');
  process.on('warning', (warning) => {
    // Suppress specific deprecation warnings
    if (warning.name === 'DeprecationWarning' && 
        (warning.message.includes('util._extend') || 
         warning.message.includes('punycode'))) {
      return;
    }
    console.warn(warning);
  });
}

const nextConfig = {
  experimental: {
    // Optimize for better performance
    optimizeCss: true,
    optimizeServerReact: true,
  },
  
  // Suppress warnings during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Suppress deprecation warnings in webpack
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    // Handle file imports
    config.module.rules.push({
      test: /\.(pdf|node)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    return config;
  },

  // Image optimization
  images: {
    domains: [
      "encrypted-tbn0.gstatic.com",
      "localhost",
      "res.cloudinary.com",
      "195.35.8.142",
      "serverapipointer.online",
      "anzaentrepreneurs.co.tz",
      "api.anzaconnect.co.tz",
      "via.placeholder.com"
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;

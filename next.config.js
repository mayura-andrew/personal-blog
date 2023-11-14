const withNextra = require('nextra')({
  theme: 'nextra-theme-blog',
  themeConfig: './theme.config.js',
  // optional: add `unstable_staticImage: true` to enable Nextra's auto image import
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // any configs you need
}

module.exports = withNextra(nextConfig)

// next.config.js
module.exports = {
  images: {
    unoptimized: true,
  },
};

// next.config.js
module.exports = {
  basePath: 'https://mayura-andrew.github.io/mayura_andrew/',
  assetPrefix: '/mayura_andrew/',
  // ... other configurations
}

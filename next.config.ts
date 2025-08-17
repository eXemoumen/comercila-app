/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Capacitor
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // Ensure CSS is properly handled in static export
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },

  // Optimize bundle splitting
  webpack: (config: unknown, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (!dev && !isServer) {
      // Optimize chunk splitting for better caching
      const webpackConfig = config as {
        optimization: {
          splitChunks: {
            cacheGroups: Record<string, unknown>;
          };
        };
      };

      webpackConfig.optimization.splitChunks = {
        ...webpackConfig.optimization.splitChunks,
        cacheGroups: {
          ...webpackConfig.optimization.splitChunks.cacheGroups,
          // Separate vendor chunks for better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chart library chunk
          charts: {
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 20,
          },
          // Separate UI library chunk
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }

    return config;
  },

  // Enable compression and optimization
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Azure Static Web Apps
  output: 'export',
  
  // Optional but recommended for static export
  images: {
    unoptimized: true,
  },
  
  // Remove reactCompiler if not needed, or configure it properly
  // reactCompiler: true, // Comment this out unless you have React Compiler set up
};

export default nextConfig;
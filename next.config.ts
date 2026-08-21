import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse depends on @napi-rs/canvas (a native addon providing a
  // DOMMatrix polyfill for pdfjs-dist's Node build) - without this, Next's
  // server bundler drops the native binary and PDF uploads crash at runtime
  // with "ReferenceError: DOMMatrix is not defined" (only in the deployed
  // Lambda bundle, not locally, since local resolution isn't bundled).
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;

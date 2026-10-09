"use client";

import React, { useState, useEffect } from 'react';

/**
 * VideoBackground Component
 * - Fixed full-viewport background with negative z-index (-z-10)
 * - Fallback /poster.jpg image displayed immediately
 * - HTML5 <video> with /bg.webm then /bg.mp4 sources
 * - Dark gradient overlay (rgba(2,6,23,0.55) to rgba(2,6,23,0.85)) for optimal readability
 * - Smart performance gate: skips video loading if prefers-reduced-motion is active
 *   or if client connection has saveData enabled / slow 2G connection.
 */
export const VideoBackground: React.FC = () => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);

  useEffect(() => {
    // 1. Accessibility check: reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (reducedMotionQuery.matches) {
        setShouldLoadVideo(false);
        return;
      }
    }

    // 2. Network constraints check: save-data or 2g
    if (typeof navigator !== 'undefined') {
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      if (connection) {
        if (connection.saveData === true) {
          setShouldLoadVideo(false);
          return;
        }
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          setShouldLoadVideo(false);
          return;
        }
      }
    }

    // Conditions met: allow video loading
    setShouldLoadVideo(true);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 bg-[#020617] overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Fallback image poster.jpg */}
      <img
        src="/poster.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
        loading="eager"
      />

      {/* 3D Animation Video: loaded conditionally */}
      {shouldLoadVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/bg.webm" type="video/webm" />
          <source src="/bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark gradient overlay for text and card contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(2, 6, 23, 0.55) 0%, rgba(2, 6, 23, 0.70) 50%, rgba(2, 6, 23, 0.85) 100%)',
        }}
      />
    </div>
  );
};

export default VideoBackground;

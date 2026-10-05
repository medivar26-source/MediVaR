'use client';

import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as cornerstone from 'cornerstone-core';
// @ts-ignore
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

let initialized = false;

export default function DicomViewer({ src, alt, className, onLoad, style }: { src: string, alt?: string, className?: string, onLoad?: (size: { naturalWidth: number, naturalHeight: number }) => void, style?: React.CSSProperties }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  // Latest callback without re-running the load effect every time the parent re-renders.
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    if (!initialized) {
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      
      // Try to initialize web workers. We point to unpkg for the worker file if needed,
      // but in newer versions it might work out of the box with the default bundle.
      try {
        cornerstoneWADOImageLoader.webWorkerManager.initialize({
          maxWebWorkers: navigator.hardwareConcurrency || 1,
          startWebWorkersOnDemand: true,
          webWorkerPath: 'https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoaderWebWorker.min.js',
          taskConfiguration: {
            decodeTask: {
              initializeCodecsOnStartup: false,
              codecsPath: 'https://unpkg.com/cornerstone-wado-image-loader@4.13.2/dist/cornerstoneWADOImageLoaderCodecs.min.js',
            }
          }
        });
      } catch (e) {
        console.warn('WADO Image Loader WebWorker initialization warning', e);
      }
      initialized = true;
    }

    const element = elementRef.current;
    if (!element) return;

    let cancelled = false;
    setError(false);

    // Enable the DOM element
    cornerstone.enable(element);

    // Keep the cornerstone canvas in sync with its container. The parent stage is
    // resized once the DICOM's natural size is known, so without this the canvas
    // stays at its initial (often wrong/zero) size and the scan looks blank.
    const resize = () => {
      try {
        cornerstone.resize(element, true);
      } catch {
        // element not enabled / no image yet
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    const loadAndDisplayImage = async () => {
      try {
        const imageId = src.startsWith('wadouri:') ? src : `wadouri:${src}`;
        const image = await cornerstone.loadImage(imageId);

        if (cancelled) return;
        cornerstone.displayImage(element, image);
        resize();
        onLoadRef.current?.({ naturalWidth: image.width, naturalHeight: image.height });
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading DICOM via URL:', err);
        setError(true);
      }
    };

    loadAndDisplayImage();

    return () => {
      cancelled = true;
      observer.disconnect();
      try {
        cornerstone.disable(element);
      } catch {
        // Ignore DOM removal errors during React unmount
      }
    };
  }, [src]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: '150px', background: '#000', overflow: 'hidden', ...style }}
      title={alt}
    >
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: '#fff', fontSize: '12px' }}>
          Failed to load DICOM
        </div>
      )}
    </div>
  );
}

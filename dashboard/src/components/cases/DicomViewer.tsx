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

    if (!elementRef.current) return;
    
    // Enable the DOM element
    cornerstone.enable(elementRef.current);
    
    const loadAndDisplayImage = async () => {
      try {
        // Fetch the file as an ArrayBuffer since wadouri might fail with CORS if not configured,
        // but if it's in the same origin or Supabase Storage with CORS it should work.
        // Wait, for Supabase URLs we can just use wadouri:
        const imageId = src.startsWith('wadouri:') ? src : `wadouri:${src}`;
        
        // Let's first try just loading the image directly
        const image = await cornerstone.loadImage(imageId);
        
        if (elementRef.current) {
          cornerstone.displayImage(elementRef.current, image);
          if (onLoad) {
            onLoad({ naturalWidth: image.width, naturalHeight: image.height });
          }
        }
      } catch (err) {
        console.error('Error loading DICOM via URL:', err);
        setError(true);
      }
    };
    
    loadAndDisplayImage();
    
    return () => {
      if (elementRef.current) {
        try {
          cornerstone.disable(elementRef.current);
        } catch (e) {
          // Ignore DOM removal errors during React unmount
        }
      }
    };
  }, [src]);

  if (error) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: '#fff', fontSize: '12px' }}>
        Failed to load DICOM
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className={className} 
      style={{ width: '100%', height: '100%', minHeight: '150px', background: '#000', overflow: 'hidden', ...style }}
      title={alt}
    />
  );
}

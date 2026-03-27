'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ArrowUpRight, Instagram, Linkedin, Youtube, Facebook, Globe, Store, CalendarCheck, MonitorPlay, CreditCard, ScanLine, Boxes, LineChart, Check, Play, Star, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useMotionValue, useTransform, animate, useInView } from 'framer-motion';

const Counter = ({ value, from = 1347, className }: { value: number; from?: number; className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const count = useMotionValue(from);
    const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, value, { 
                duration: 1.5, 
                ease: [0.1, 0.9, 0.1, 1], // Aggressive EaseOutExpo
                delay: 0
            });
            return () => controls.stop();
        }
    }, [count, value, isInView]);

    return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
};

// ==========================================
// SPHERE IMAGE GRID TYPES & INTERFACES
// ==========================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number;  // Azimuth angle in degrees
  phi: number;    // Polar angle in degrees
  radius: number; // Distance from center
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

export interface SphereImageGridProps {
  images?: ImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
}

interface RotationState {
  x: number;
  y: number;
  z: number;
}

interface VelocityState {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),

  sphericalToCartesian: (radius: number, theta: number, phi: number): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }),

  calculateDistance: (pos: Position3D, center: Position3D = { x: 0, y: 0, z: 0 }): number => {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const dz = pos.z - center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }
};

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  images = [],
  containerSize = 400,
  sphereRadius = 200,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = ''
}) => {

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rotation, setRotation] = useState<RotationState>({ x: 15, y: 15, z: 0 });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  const actualSphereRadius = sphereRadius || containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;

    for (let i = 0; i < imageCount; i++) {
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      if (phi < 90) {
        phi = Math.max(5, phi - poleBonus);
      } else {
        phi = Math.min(175, phi + poleBonus);
      }
      phi = 15 + (phi / 180) * 150;
      const randomOffset = (Math.random() - 0.5) * 20;
      theta = (theta + randomOffset) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));
      positions.push({ theta, phi, radius: actualSphereRadius });
    }
    return positions;
  }, [images.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    const positions = imagePositions.map((pos, index) => {
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);
      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1; z = z1;
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2; z = z2;
      const worldPos: Position3D = { x, y, z };
      const fadeZoneStart = -10;
      const fadeZoneEnd = -30;
      const isVisible = worldPos.z > fadeZoneEnd;
      let fadeOpacity = 1;
      if (worldPos.z <= fadeZoneStart) {
        fadeOpacity = Math.max(0, (worldPos.z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd));
      }
      const isPoleImage = pos.phi < 30 || pos.phi > 150;
      const distanceFromCenter = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y);
      const maxDistance = actualSphereRadius;
      const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);
      const distancePenalty = isPoleImage ? 0.4 : 0.7;
      const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);
      const depthScale = (worldPos.z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);
      return { ...worldPos, scale, zIndex: Math.round(1000 + worldPos.z), isVisible, fadeOpacity, originalIndex: index };
    });

    const adjustedPositions = [...positions];
    for (let i = 0; i < adjustedPositions.length; i++) {
        const pos = adjustedPositions[i];
        if (!pos.isVisible) continue;
        let adjustedScale = pos.scale;
        const imageSize = baseImageSize * adjustedScale;
        for (let j = 0; j < adjustedPositions.length; j++) {
            if (i === j) continue;
            const other = adjustedPositions[j];
            if (!other.isVisible) continue;
            const otherSize = baseImageSize * other.scale;
            const dx = pos.x - other.x;
            const dy = pos.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (imageSize + otherSize) / 2 + 25;
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;
                const reductionFactor = Math.max(0.4, 1 - (overlap / minDistance) * 0.6);
                adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
            }
        }
        adjustedPositions[i] = { ...pos, scale: Math.max(0.25, adjustedScale) };
    }
    return adjustedPositions;
  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);

  const clampRotationSpeed = useCallback((speed: number): number => {
    return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
  }, [maxRotationSpeed]);

  const updateMomentum = useCallback(() => {
    if (isDragging) return;
    setVelocity(prev => {
      const newVelocity = { x: prev.x * momentumDecay, y: prev.y * momentumDecay };
      if (!autoRotate && Math.abs(newVelocity.x) < 0.01 && Math.abs(newVelocity.y) < 0.01) return { x: 0, y: 0 };
      return newVelocity;
    });
    setRotation(prev => {
      let newY = prev.y;
      if (autoRotate) newY += autoRotateSpeed;
      newY += clampRotationSpeed(velocity.y);
      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)),
        y: SPHERE_MATH.normalizeAngle(newY),
        z: prev.z
      };
    });
  }, [isDragging, momentumDecay, velocity, clampRotationSpeed, autoRotate, autoRotateSpeed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    const rotationDelta = { x: -deltaY * dragSensitivity, y: deltaX * dragSensitivity };
    setRotation(prev => ({
      x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
      y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
      z: prev.z
    }));
    setVelocity({ x: clampRotationSpeed(rotationDelta.x), y: clampRotationSpeed(rotationDelta.y) });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.current.x;
    const deltaY = touch.clientY - lastMousePos.current.y;
    const rotationDelta = { x: -deltaY * dragSensitivity, y: deltaX * dragSensitivity };
    setRotation(prev => ({
      x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
      y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
      z: prev.z
    }));
    setVelocity({ x: clampRotationSpeed(rotationDelta.x), y: clampRotationSpeed(rotationDelta.y) });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => setIsMounted(true), []);
  useEffect(() => setImagePositions(generateSpherePositions()), [generateSpherePositions]);

  useEffect(() => {
    const animate = () => { updateMomentum(); animationFrame.current = requestAnimationFrame(animate); };
    if (isMounted) animationFrame.current = requestAnimationFrame(animate);
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMounted, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const worldPositions = calculateWorldPositions();

  const renderImageNode = useCallback((image: ImageData, index: number) => {
    const position = worldPositions[index];
    if (!position || !position.isVisible) return null;
    const imageSize = baseImageSize * position.scale;
    const isHovered = hoveredIndex === index;
    const finalScale = isHovered ? Math.min(1.2, 1.2 / position.scale) : 1;
    return (
      <div
        key={image.id}
        className="absolute cursor-pointer select-none transition-transform duration-200 ease-out"
        style={{
          width: `${imageSize}px`,
          height: `${imageSize}px`,
          left: `${containerSize/2 + position.x}px`,
          top: `${containerSize/2 + position.y}px`,
          opacity: position.fadeOpacity,
          transform: `translate(-50%, -50%) scale(${finalScale})`,
          zIndex: position.zIndex
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => setSelectedImage(image)}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white/20">
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" draggable={false} loading={index < 3 ? 'eager' : 'lazy'} />
        </div>
      </div>
    );
  }, [worldPositions, baseImageSize, containerSize, hoveredIndex]);

  if (!isMounted) return <div className="bg-gray-100 rounded-lg animate-pulse flex items-center justify-center" style={{ width: containerSize, height: containerSize }}><div className="text-gray-400">Loading...</div></div>;
  if (!images.length) return <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center" style={{ width: containerSize, height: containerSize }}><div className="text-gray-400 text-center"><p>No images provided</p><p className="text-sm">Add images to the images prop</p></div></div>;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <div
        ref={containerRef}
        className={`relative select-none cursor-grab active:cursor-grabbing ${className}`}
        style={{ width: containerSize, height: containerSize, perspective: `${perspective}px` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => renderImageNode(image, index))}
        </div>
      </div>
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setSelectedImage(null)} style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleIn 0.3s ease-out' }}>
            <div className="relative aspect-square">
              <img src={selectedImage.src} alt={selectedImage.alt} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 rounded-full text-white flex items-center justify-center hover:bg-opacity-70 transition-all cursor-pointer"><X size={16} /></button>
            </div>
            {(selectedImage.title || selectedImage.description) && (
              <div className="p-6">
                {selectedImage.title && <h3 className="text-xl font-bold mb-2">{selectedImage.title}</h3>}
                {selectedImage.description && <p className="text-gray-600">{selectedImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [billPlan, setBillPlan] = useState<"monthly" | "annually">("monthly");


    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 900);
    });

    const businessScrollRef = useRef<HTMLDivElement>(null);
    const operatorsScrollRef = useRef<HTMLDivElement>(null);


    const scrollBusiness = (direction: 'left' | 'right') => {
        if (businessScrollRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            businessScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const scrollOperators = (direction: 'left' | 'right') => {
        if (operatorsScrollRef.current) {
            const scrollAmount = direction === 'left' ? -600 : 600;
            operatorsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const features = [
        {
            title: "Manage orders and payments with fewer taps.",
            cards: [
                { title: "Point of Sale", desc: "Run efficient service with an intuitive system, flexible to how your business runs.", link: "Discover Lole's POS" },
                { title: "Kitchen Display", desc: "Fly through tickets with spot-on accuracy. Get every order right, with less in your way.", link: "Discover Lole's KDS" },
                { title: "Payments", desc: "Quick, secure, and embedded in your flow. Secure reservations, split bills, send invoices.", link: "Discover Lole's Payments" },
                { title: "QR Ordering", desc: "More covers, less wait for guests. Take more orders and payments with fewer staff.", link: "Discover Lole's QR Ordering" }
            ]
        },
        {
            title: "Welcome guests and regulars, and make everyone feel recognized.",
            cards: [
                { title: "Reservations", desc: "Fill tables securely, automate waitlists, message guests instantly, and track requests.", link: "Discover Lole's Reservations" },
                { title: "Insights", desc: "Understand your guests better: see average spend, top products, returning guests, and tips.", link: "Discover Lole's Insights" },
                { title: "Point of Sale", desc: "Check in guests, see guest reservation notes, and give discounts to VIPs and regulars.", link: "Discover Lole's POS" },
                { title: "Kitchen Display", desc: "Get every order right with clear notes for modifiers, allergies, and special requests.", link: "Discover Lole's KDS" }
            ]
        },
        {
            title: "Real-time visibility for more control and fewer errors.",
            cards: [
                { title: "Insights", desc: "Check how your business is doing in real time, right from your phone.", link: "Discover Lole's Insights" },
                { title: "Payments", desc: "Reliable, embedded payments that handle any payment method.", link: "Discover Lole's Payments" },
                { title: "Point of Sale", desc: "Control the flow of the floor, monitor every cover, and spot which tables need extra service.", link: "Discover Lole's POS" },
                { title: "Inventory", desc: "Reduce waste with real-time stock that updates with every order.", link: "Discover Lole's Inventory" }
            ]
        },
        {
            title: "One single source of data to keep you flowing.",
            cards: [
                { title: "Insights", desc: "See across your entire business, from reservations to revenue, and products to productivity.", link: "Discover Lole's Insights" },
                { title: "Reservations", desc: "Build valuable guest profiles with allergies, top ordered products, return visits, and average tips.", link: "Discover Lole's Reservations" },
                { title: "Kitchen Display", desc: "Never miss a dish, modifier or note. Keep your kitchen flowing with orders directly synced from the POS.", link: "Discover Lole's KDS" },
                { title: "Payments", desc: "Track all revenue: bills, pre-payments, and invoices in a single connected system.", link: "Discover Lole's Payments" }
            ]
        },
        {
            title: "Grow your margins on every sale.",
            cards: [
                { title: "Insights", desc: "Grow your business by tracking which products, shifts, and stations bring the most profit.", link: "Discover Lole's Insights" },
                { title: "Point of Sale", desc: "Adjust discounts, modifiers, and prices in a few taps to improve your margins.", link: "Discover Lole's POS" },
                { title: "Inventory", desc: "Reduce waste and over-ordering with real-time stock that updates with every sale.", link: "Discover Lole's Inventory" },
                { title: "QR Ordering", desc: "Take more orders with less staff. Create a new revenue stream with seamless ordering and payment.", link: "Discover Lole's QR Ordering" }
            ]
        }
    ];

    // Removed manual scroll listener in favor of motion hook above

    return (
        <main className="font-inter relative bg-white text-gray-900 antialiased tracking-[-0.07em]">
            {/* Sticky/Floating Header */}
            <div
                className={`fixed left-0 right-0 top-0 z-50 flex w-full justify-center transition-all duration-500 ease-in-out ${
                    isScrolled ? 'px-4 py-4 md:px-8 md:py-6' : 'p-3 md:p-4'
                }`}
            >
                <header
                    onMouseLeave={() => setIsFeaturesOpen(false)}
                    className={`relative z-50 flex w-full flex-col transition-all duration-500 ease-in-out ${
                        isFeaturesOpen
                            ? (isScrolled ? 'max-w-6xl rounded-2xl md:rounded-3xl' : 'max-w-full rounded-2xl md:rounded-3xl')
                            : isScrolled
                              ? 'max-w-6xl rounded-2xl md:rounded-3xl bg-[#8a887a]/95 shadow-xl backdrop-blur-md'
                              : 'max-w-full rounded-2xl md:rounded-3xl bg-transparent'
                    }`}
                >
                    {/* Header Top Row */}
                    <div className={`flex w-full items-center justify-between transition-all duration-500 ease-in-out ${
                        isScrolled ? 'px-6 py-4 md:px-10' : 'px-6 py-6 md:px-14 lg:px-20 lg:py-8'
                    }`}>
                        {/* Left: Logo & Links */}
                        <div className="flex items-center gap-8 md:gap-12">
                            {/* Logo */}
                            <Link
                                href="/"
                                className="relative flex items-center h-8 md:h-10 w-24 md:w-32 transition-opacity hover:opacity-90 translate-x-[20px]"
                            >
                                <img src="/logo.svg" alt="Lole" className="absolute left-0 top-1/2 -translate-y-1/2 h-[74px] md:h-[90px] w-auto max-w-none origin-left" />
                            </Link>

                            {/* Desktop Nav Links */}
                            <nav className={`hidden items-center gap-6 lg:flex transition-transform duration-500 ease-in-out ${isScrolled ? '-translate-x-[20px]' : ''}`}>
                                <div
                                    onMouseEnter={() => setIsFeaturesOpen(true)}
                                    className="relative flex cursor-pointer items-center gap-1 py-4 -my-4"
                                >
                                    <span
                                        className={`flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-[14px] font-medium leading-[21px] transition-colors ${
                                            isFeaturesOpen
                                                ? 'bg-[#DDF853] text-black'
                                                : 'text-white/90 hover:text-white'
                                        }`}
                                    >
                                        Features
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isFeaturesOpen ? 'rotate-180 text-black' : 'text-white/70'}`} />
                                    </span>
                                </div>
                                {['Business types', 'Resources', 'Pricing', 'About'].map((item, idx) => (
                                    <Link
                                        key={idx}
                                        href="#"
                                        className={`flex items-center gap-1 text-[14px] font-medium leading-[21px] transition-colors ${
                                            isFeaturesOpen ? 'text-gray-800 hover:text-black' : 'text-white/90 hover:text-white'
                                        }`}
                                    >
                                        {item}
                                        {(item === 'Business types' || item === 'Resources') && (
                                            <ChevronDown className={`h-3.5 w-3.5 ${isFeaturesOpen ? 'text-gray-500' : 'text-white/70'}`} />
                                        )}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Right: Actions */}
                        <div className="hidden items-center gap-4 md:flex">
                            <Link
                                href="/auth/login"
                                className={`text-[14px] font-medium leading-[21px] transition-colors ${
                                    isFeaturesOpen ? 'text-gray-800 hover:text-black' : 'text-white hover:text-white/80'
                                }`}
                            >
                                Log in
                            </Link>
                            <div className={`h-3.5 w-px transition-colors ${isFeaturesOpen ? 'bg-gray-300' : 'bg-white/30'}`}></div>
                            <Link
                                href="/auth/signup"
                                className={`text-[14px] font-medium leading-[21px] transition-colors ${
                                    isFeaturesOpen ? 'text-gray-800 hover:text-black' : 'text-white hover:text-white/80'
                                }`}
                            >
                                Get started
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="flex items-center gap-1.5 rounded-[16px] bg-[#DDF853] px-6 py-3 text-[14px] font-medium leading-[21px] text-black transition-colors hover:bg-[#cbe346]"
                            >
                                Book a demo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Mega Menu Dropdown Panel (True sliding drawer from top of viewport) */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: isFeaturesOpen ? 1 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut', delay: isFeaturesOpen ? 0 : 0 }}
                        className={`absolute left-0 right-0 top-0 -z-10 w-full overflow-hidden ${isScrolled ? 'rounded-2xl md:rounded-3xl' : 'rounded-2xl md:rounded-3xl'} shadow-2xl transition-shadow duration-300 ${isFeaturesOpen ? 'pointer-events-auto shadow-black/10' : 'pointer-events-none shadow-transparent'}`}
                    >
                        <motion.div
                            initial={false}
                            animate={{ y: isFeaturesOpen ? 0 : '-100%' }}
                            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                            className="w-full bg-[#F4F3EF] pb-2 pt-[88px] md:pt-[104px]"
                        >
                            <motion.div
                                initial={false}
                                animate={{ opacity: isFeaturesOpen ? 1 : 0, y: isFeaturesOpen ? 0 : 8 }}
                                transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1], delay: isFeaturesOpen ? 0.11 : 0 }}
                                className="border-t border-black/5 px-6 pb-4 pt-6 md:px-14 lg:px-20"
                            >
                                <div className="grid max-w-[1050px] grid-cols-4 gap-x-8 gap-y-5">
                                    {/* Column 1 */}
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <Store className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                Point of Sale
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                A POS that flexes to your needs — intuitive, easy to learn, and connected to keep your business flowing.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <ScanLine className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                QR ordering
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                From table to prep ticket to payment, serve guests faster and let the floor run itself.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Column 2 */}
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <CalendarCheck className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                Reservations
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                Fill your tables easier with valuable guests to grow more predictable revenue.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <Boxes className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                Inventory
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                With speedy sales and accurate stock-keeping, you can monitor your products in one view.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Column 3 */}
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <MonitorPlay className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                Kitchen Display
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                Orders flow directly from your POS to the kitchen in real time. Fly through tickets without costly mistakes.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <LineChart className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                Insights
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                Understand how your daily ops drive real-time revenue, so you can grow your business confidently.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Column 4 */}
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 font-inter text-[14px] font-medium leading-[21px] text-black">
                                                <CreditCard className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                                                Payments
                                            </div>
                                            <p className="max-w-[200px] font-inter text-[12.5px] font-medium leading-[18px] text-gray-500/85">
                                                Secure your revenue at the speed you need.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </header>
            </div>

            {/* Top Panel: Hero Section Wrapper with uniform spacing gap */}
            <div className="box-border h-svh w-full p-3 md:p-4">
                {/* Hero Card */}
                <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-gray-900 md:rounded-3xl">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://res.cloudinary.com/dcm6m7d81/image/upload/v1774504640/9pzsEjPpCGZ2zEKMUp_Oti_e8qovr.png')",
                        }}
                    ></div>

                    {/* Hero Content */}
                    <div className="relative z-10 -mt-[100px] flex flex-grow flex-col items-center justify-center px-4 text-center">
                        <h1 className="mx-auto mb-6 max-w-4xl text-3xl leading-[1.05] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
                            Tech that gives your
                            <br />
                            restaurant flow.
                        </h1>
                        <p className="mx-auto mb-8 max-w-2xl text-[18px] font-medium leading-[27px] text-white">
                            Lole intelligently connects your daily operations to your back-office
                            admin so you can run smoother service and plan with confidence.
                        </p>
                        <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
                            <Link
                                href="/auth/signup"
                                className="flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#DDF853] px-6 py-3 text-[14px] font-medium leading-[21px] text-black transition-colors hover:bg-[#cbe346] sm:w-auto"
                            >
                                Book a demo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="flex w-full items-center justify-center rounded-[16px] border border-white/40 bg-transparent px-6 py-3 text-[14px] font-medium leading-[21px] text-white transition-colors hover:bg-white/10 sm:w-auto"
                            >
                                Get started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>


            {/* Bottom Panel: FAQ & CTA Wrapper */}
            <div className="relative flex w-full flex-col bg-[#F5F5F3]">
                
                {/* Operators Testimonial Section */}
                <section className="w-full py-16 px-4 md:px-10 lg:px-20 overflow-hidden">
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-12">
                            <h2 className="text-black text-[32px] md:text-[48px] font-semibold tracking-[-0.07em] leading-[0.95] translate-x-[125px]">
                                Why operators choose Lole.
                            </h2>
                            <div className="flex gap-2.5 mb-2.5">
                                <button 
                                    onClick={() => scrollOperators('left')}
                                    className="w-[34px] h-[34px] rounded-full bg-black/5 border border-black/5 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/10 transition-all active:scale-95"
                                >
                                    <ChevronLeft className="h-4.5 w-4.5" />
                                </button>
                                <button 
                                    onClick={() => scrollOperators('right')}
                                    className="w-[34px] h-[34px] rounded-full bg-black/5 border border-black/5 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/10 transition-all active:scale-95"
                                >
                                    <ChevronRight className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>

                        <div 
                            ref={operatorsScrollRef}
                            className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                        >
                            {[
                                {
                                    name: "ZeroZero",
                                    location: "Addis Ababa",
                                    type: "Restaurant",
                                    quote: "“Lole really helped us to gain insights on what we can expect, what we've done in the past, what we're doing at the moment itself.”",
                                    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop",
                                    logo: "ZEROZERO"
                                },
                                {
                                    name: "Zoldering",
                                    location: "Addis Ababa",
                                    type: "Restaurant*",
                                    quote: "“Lole didn't just replace our tools. It helped us rethink how we work with one seamless, integrated platform.”",
                                    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop",
                                    logo: "ZOLDERING"
                                },
                                {
                                    name: "The Daily Grind",
                                    location: "Addis Ababa",
                                    type: "Cafe",
                                    quote: "“The real-time insights allow us to optimize our shifts during peak hours, significantly improving our bottom line.”",
                                    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop",
                                    logo: "GRIND"
                                }
                            ].map((op, idx) => (
                                <div 
                                    key={idx}
                                    className="relative min-w-[432px] md:min-w-[732px] lg:min-w-[862px] h-[550px] md:h-[550px] lg:h-[620px] rounded-[32px] overflow-hidden group cursor-pointer shadow-xl shadow-black/5"
                                >
                                    <img 
                                        src={op.image} 
                                        alt={op.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                                    
                                    {/* Card Header Content */}
                                    <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                                        <div className="text-white font-bold -tracking-widest text-[20px] md:text-[24px]">
                                            <span className="opacity-50 -tracking-widest">{op.logo.slice(0, Math.floor(op.logo.length/2))}</span>
                                            <span className="-tracking-widest">{op.logo.slice(Math.floor(op.logo.length/2))}</span>
                                        </div>
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                                            <Play className="h-4 w-4 md:h-5 md:w-5 fill-current ml-[2px]" />
                                        </div>
                                    </div>

                                    {/* Card Footer Content */}
                                    <div className="absolute bottom-0 left-0 right-0">
                                        <div className="absolute inset-0 backdrop-blur-md mask-[linear-gradient(to_top,black_40%,transparent)]" />
                                        <div className="relative z-10 px-8 pb-10 pt-4 md:px-12 md:pb-12 md:pt-6">
                                            <p className="text-white text-[18px] md:text-[24px] font-semibold leading-[1.3] mb-8">
                                                {op.quote}
                                            </p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {[op.name, op.location, op.type].map((tag, i) => (
                                                    <span key={i} className="px-5 py-2 rounded-2xl border border-white/20 backdrop-blur-md text-white text-[13px] font-medium transition-colors hover:bg-white/10">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Business Types Section */}
                <section className="bg-[#17120B] w-full py-12 px-4 md:px-10 lg:px-20 overflow-hidden">
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-16">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-white text-[32px] md:text-[48px] font-semibold tracking-[-0.07em] leading-[0.95] translate-x-[125px]">
                                    For small shops and fine dining.
                                </h2>
                                <p className="text-[#888884] text-[32px] md:text-[48px] font-semibold tracking-[-0.07em] leading-[0.95] translate-x-[125px]">
                                    Lole flexes to your needs.
                                </p>
                            </div>
                            <div className="flex gap-2.5 mb-2.5 translate-y-[40px]">
                                <button 
                                    onClick={() => scrollBusiness('left')}
                                    className="w-[34px] h-[34px] rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-95"
                                >
                                    <ChevronLeft className="h-4.5 w-4.5" />
                                </button>
                                <button 
                                    onClick={() => scrollBusiness('right')}
                                    className="w-[34px] h-[34px] rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-95"
                                >
                                    <ChevronRight className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                        
                        <div 
                            ref={businessScrollRef}
                            className="flex gap-5 md:gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                        >
                            {[
                                { name: "Restaurants", description: "Fine dining, casual dining, and fast casual. Manage every table and order with precision.", image: "/images/business-types/restaurants.png" },
                                { name: "Bars & Clubs", description: "High-volume service for high-energy environments. Keep the drinks flowing smoothly.", image: "/images/business-types/bars.png" },
                                { name: "Cafes & Bakeries", description: "From the first coffee to the last pastry. Designed for the unique flow of cafes.", image: "/images/business-types/cafes.png" },
                                { name: "Quick Service", description: "Speed is the standard. Streamline counter and drive-thru operations with ease.", image: "/images/business-types/quick-service.png" },
                                { name: "Events & Venues", description: "Reliable tech that scales. High-speed ordering for high-capacity stadiums and arenas.", image: "/images/business-types/events.png" }
                            ].map((item, idx) => (
                                <div 
                                    key={idx}
                                    className="relative min-w-[342px] md:min-w-[422px] lg:min-w-[382px] h-[460px] md:h-[550px] lg:h-[500px] rounded-[32px] overflow-hidden group cursor-pointer shadow-2xl"
                                >
                                    <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                                    
                                    {/* Top Link Icon */}
                                    <div className="absolute top-10 right-10 w-11 h-11 rounded-full bg-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                        <ArrowUpRight className="h-5 w-5 text-black" strokeWidth={2} />
                                    </div>

                                    {/* Text Content */}
                                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-300">
                                        <div className="absolute inset-0 backdrop-blur-md mask-[linear-gradient(to_top,black_40%,transparent)]" />
                                        <div className="relative z-10 px-10 pb-10 pt-6 flex flex-col">
                                            <span className="text-white text-[26px] font-semibold tracking-tight">
                                                {item.name}
                                            </span>
                                            <div className="grid grid-rows-[0fr] transition-all duration-500 ease-in-out group-hover:grid-rows-[1fr] group-hover:mt-2">
                                                <div className="overflow-hidden">
                                                    <p className="text-white/80 text-[16px] font-medium leading-[1.4] opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sticky Features Gallery */}
                <div className="w-full py-16 md:py-24">
                    <div className="w-full px-4 md:px-10 lg:px-20 box-border mb-12 md:mb-16">
                        <h2 className="text-[36px] md:text-[48px] font-semibold tracking-[-0.07em] text-black leading-none max-w-[600px] translate-x-[125px]">
                            Everything you need<br />in one connected system.
                        </h2>
                    </div>

                    <div className="grid grid-cols-12 gap-6 px-4 md:px-10 lg:px-20">

                        {/* Left column — 5 cards, scrolls normally */}
                        <div className="col-span-4 grid gap-6">

                            {/* Card 1: Point of Sale */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
                                    alt="Point of Sale"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Point of Sale</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Run efficient service with an intuitive system, flexible to how your business runs.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s POS <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 2: Reservations */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1550966841-3ee7adac1af8?q=80&w=2070&auto=format&fit=crop"
                                    alt="Reservations"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Reservations</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Fill tables securely, automate waitlists, message guests instantly, and track every special request.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Reservations <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 3: Payments */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=600&auto=format&fit=crop"
                                    alt="Payments"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Payments</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Quick, secure, and embedded in your flow. Split bills, send invoices, accept Telebirr and more.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Payments <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 4: QR Ordering */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=2070&auto=format&fit=crop"
                                    alt="QR Ordering"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">QR Ordering</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">More covers, less wait for guests. Take orders and payments with fewer staff on the floor.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s QR Ordering <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 5: Inventory */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1621415263409-225965ed2a72?q=80&w=2070&auto=format&fit=crop"
                                    alt="Inventory"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Inventory</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Reduce waste and over-ordering with real-time stock that updates automatically with every sale.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Inventory <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                        </div>

                        {/* Middle column — 3 cards, STICKY, fills viewport height, grid-rows-3 */}
                        <div className="sticky top-0 h-screen col-span-4 gap-6 grid grid-rows-3">

                            {/* Sticky Card 1: Kitchen Display */}
                            <figure className="relative w-full h-full overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1551218808-94e2183e1622?q=80&w=2070&auto=format&fit=crop"
                                    alt="Kitchen Display"
                                    className="transition-all duration-500 h-full w-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Kitchen Display</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Fly through tickets with spot-on accuracy. Orders flow directly from POS to kitchen in real time.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s KDS <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Sticky Card 2: Insights */}
                            <figure className="relative w-full h-full overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2070&auto=format&fit=crop"
                                    alt="Insights"
                                    className="transition-all duration-500 h-full w-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Insights</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Understand your daily ops and revenue in real time, right from your phone.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Insights <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Sticky Card 3: Offline Sync */}
                            <figure className="relative w-full h-full overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1622675363211-6e79b139749a?q=80&w=2070&auto=format&fit=crop"
                                    alt="Offline Sync"
                                    className="transition-all duration-500 h-full w-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Offline Sync</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Built for Addis. Keep taking orders and payments even when the internet drops.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Learn about Offline Mode <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                        </div>

                        {/* Right column — 5 cards, scrolls normally */}
                        <div className="col-span-4 grid gap-6">

                            {/* Card 1: Guest Profiles */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2070&auto=format&fit=crop"
                                    alt="Guest Profiles"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Guest Profiles</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Build rich guest profiles with allergies, top ordered products, return visits, and VIP notes.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Reservations <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 2: Table Management */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
                                    alt="Table Management"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Table Management</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Control the flow of the floor, monitor every cover, and spot which tables need extra attention.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s POS <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 3: Staff & Shifts */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1505935428862-770b6f24f629?q=80&w=2071&auto=format&fit=crop"
                                    alt="Staff & Shifts"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Staff &amp; Shifts</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Track which shifts and stations drive the most profit. Optimize your team with real data.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Insights <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 4: Menu Builder */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop"
                                    alt="Menu Builder"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Menu Builder</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">Adjust discounts, modifiers, and prices in a few taps to boost your margins and drive more sales.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s POS <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                            {/* Card 5: Multi-Location */}
                            <figure className="relative w-full h-96 overflow-hidden rounded-[16px] group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2070&auto=format&fit=crop"
                                    alt="Multi-Location"
                                    className="transition-all duration-500 w-full h-full object-cover group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                    <h3 className="text-white text-[18px] font-semibold tracking-tight">Multi-Location</h3>
                                    <p className="text-white/70 text-[13px] leading-relaxed">See across your entire business from a single dashboard. One source of truth for every location.</p>
                                    <Link href="#" className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/90 mt-1 hover:text-white transition-colors w-fit border-b border-white/30 pb-0.5 hover:border-white">
                                        Discover Lole&apos;s Insights <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </figure>

                        </div>
                    </div>
                </div>


                {/* Pricing Section */}
                <div className="w-full px-4 md:px-10 lg:px-20 pt-8 md:pt-12 relative z-10 box-border">
                    <div className="w-full">
                        <div className="flex flex-col w-full mb-12 px-2 md:px-0 gap-8">
                            <h2 className="text-[32px] md:text-[44px] font-semibold tracking-[-0.07em] text-black text-center md:text-left translate-x-[125px]">
                                Pricing that works for you.
                            </h2>
                            
                            {/* Toggle Button Container - Centered to align with middle card (Pro) */}
                            <div className="flex justify-center w-full">
                                <div 
                                    onClick={() => setBillPlan(prev => prev === 'monthly' ? 'annually' : 'monthly')}
                                    className="flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-black/5 cursor-pointer hover:bg-white/70 transition-colors select-none"
                                >
                                    <span className={`text-sm font-medium transition-colors ${billPlan === 'monthly' ? 'text-black' : 'text-black/40'}`}>Monthly</span>
                                    <div className="relative rounded-full focus:outline-none">
                                        <div className="w-12 h-6 transition rounded-full shadow-sm outline-none bg-[#1C1917]"></div>
                                        <div
                                            className={`absolute inline-flex items-center justify-center w-4 h-4 transition-all duration-500 ease-in-out top-1 left-1 rounded-full bg-white ${
                                                billPlan === "annually" ? "translate-x-6" : "translate-x-0"
                                            }`}
                                        />
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${billPlan === 'annually' ? 'text-black' : 'text-black/40'}`}>Annually</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mx-auto max-w-[1340px]">
                            {[
                                {
                                    title: "Starter",
                                    desc: "Perfect for small cafes and restaurants starting their digital journey.",
                                    monthlyPrice: 2900,
                                    annuallyPrice: 29000,
                                    buttonText: "Start with Starter",
                                    features: [
                                        "Access to 50+ Menu items",
                                        "Offline sync support",
                                        "Standard KDS support",
                                        "Basic analytics",
                                        "1 terminal license",
                                        "Community support",
                                        "Standard updates"
                                    ]
                                },
                                {
                                    title: "Pro",
                                    desc: "For busy venues requiring advanced inventory, multi-terminal KDS, and priority support.",
                                    monthlyPrice: 7900,
                                    annuallyPrice: 79000,
                                    badge: "Best Value",
                                    buttonText: "Upgrade to Pro",
                                    features: [
                                        "Unlimited Menu items",
                                        "Advanced Inventory & Stock",
                                        "Multi-terminal KDS",
                                        "Live performance tracking",
                                        "10 project licenses",
                                        "Priority WhatsApp support",
                                        "Team collaboration tools"
                                    ]
                                },
                                {
                                    title: "Enterprise",
                                    desc: "Built for major restaurant groups and multi-location franchises needing maximum control.",
                                    monthlyPrice: 15900,
                                    annuallyPrice: 159000,
                                    buttonText: "Contact Sales",
                                    features: [
                                        "Everything in Pro",
                                        "Custom API integrations",
                                        "Dedicated Account Manager",
                                        "Enterprise-grade Security",
                                        "Unlimited terminal licenses",
                                        "Multi-location management",
                                        "99.9% Uptime SLA"
                                    ]
                                }
                            ].map((plan, idx) => (
                                <div 
                                    key={idx}
                                    className={`relative flex flex-col bg-white rounded-4xl p-8 md:p-10 transition-all duration-300 ${plan.badge ? 'shadow-xl shadow-black/2' : ''}`}
                                >
                                    {plan.badge && (
                                        <div className="absolute top-6 right-8 rounded-[16px] bg-[#DDF853] px-5 py-2.5 text-[14px] font-medium leading-[21px] text-black shadow-sm">
                                            Best value
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col mb-10">
                                        <h3 className="text-[20px] font-semibold text-black mb-4">{plan.title}</h3>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className="text-[40px] md:text-[56px] font-semibold tracking-[-0.07em] text-black">
                                                <AnimatePresence mode="wait">
                                                    <motion.span
                                                        key={billPlan}
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -20, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        className="block"
                                                    >
                                                        {billPlan === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.annuallyPrice.toLocaleString()}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </span>
                                            <span className="text-[18px] font-medium text-black/40">
                                                Br/{billPlan === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        </div>
                                        <p className="text-[15px] leading-relaxed text-black/60 max-w-[340px]">
                                            {plan.desc}
                                        </p>
                                    </div>

                                    <div className="flex flex-col mb-10 w-full">
                                        <Button 
                                            variant="ghost"
                                            size="lg" 
                                            className={`w-full rounded-[16px] h-14 text-[14px] font-medium transition-all duration-300 shadow-none ${plan.badge ? 'bg-[#292723] text-white hover:bg-[#3d3a34]' : 'bg-transparent border border-black/10 text-black hover:bg-black/2'}`}
                                        >
                                            {plan.buttonText}
                                        </Button>
                                        <span className="text-[12px] text-center text-black/40 mt-3 font-medium">
                                            {billPlan === 'monthly' ? 'Billed monthly' : 'Billed in one annual payment'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-3.5 border-t border-black/5 pt-8">
                                        <span className="text-[14px] font-semibold text-black mb-1">Includes:</span>
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5">
                                                    <Check className="h-3 w-3 text-black" />
                                                </div>
                                                <span className="text-[14px] font-medium text-black/70">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="w-full px-4 md:px-10 lg:px-20 pt-24 pb-8 md:pt-32">
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                        {/* Left Content */}
                        <div className="lg:col-span-5 flex flex-col">
                            <h2 className="text-[48px] font-semibold tracking-[-0.07em] text-black mb-6 leading-[0.9] translate-x-[125px]">
                                FAQ
                            </h2>
                            <p className="text-[15px] font-medium leading-[1.6] text-black max-w-[460px] translate-x-[125px]">
                                Find quick answers to our most common questions. If you
                                can't find what you need, visit our <Link href="#" className="underline underline-offset-2 hover:text-gray-600 transition-colors">help section</Link> or <Link href="#" className="underline underline-offset-2 hover:text-gray-600 transition-colors">contact us</Link>.
                            </p>
                        </div>

                        {/* Right Content: FAQ Items */}
                        <div className="lg:col-span-7 flex flex-col gap-3 mx-auto max-w-3xl w-full -translate-x-[100px]">
                            {[
                                "How is Lole different from other POS systems?",
                                "What type of businesses can benefit from Lole?",
                                "How does pricing work?",
                                "What hardware do I need?",
                                "How are payments handled?"
                            ].map((question, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="group flex flex-col bg-white rounded-[20px] transition-all duration-300 cursor-pointer overflow-hidden border border-transparent"
                                >
                                    <div className="flex items-center justify-between px-8 py-6">
                                        <span className="text-[15px] font-semibold text-black leading-tight">
                                            {question}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-black/60 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                                    </div>
                                    <div 
                                        className={`px-8 transition-all duration-300 ease-in-out ${
                                            openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <p className="text-[14px] leading-relaxed text-gray-500">
                                            {idx === 0 ? "Lole is built specifically for local restaurant operations in Addis Ababa, focusing on offline reliability, multi-tenant security, and intuitive staff workflows." : 
                                             idx === 1 ? "Any restaurant, cafe, bar or bakery looking to modernize their operations and improve service speed can benefit from Lole's platform." :
                                             idx === 2 ? "We offer transparent, volume-based pricing designed to scale with your business. Contact our sales team for a detailed breakdown." :
                                             idx === 3 ? "Lole is compatible with standard Android tablets and professional KDS displays. We also support standard thermal printers." :
                                             "We support all major local payment methods including Telebirr, CBE Birr, and international cards through our secure payment gateway."}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="flex w-full justify-center px-6 py-16 md:px-12 md:py-24">
                    <div className="flex w-full max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
                        <h2 className="text-center text-[24px] font-semibold leading-[1.1] tracking-[-0.07em] text-black md:text-left md:text-[34px]">
                            Start flowing with Lole today.
                        </h2>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/auth/signup"
                                className="flex items-center justify-center rounded-[16px] bg-[#292723] px-6 py-3 text-[14px] font-medium leading-[21px] text-white transition-colors hover:bg-[#3d3a34]"
                            >
                                Get started
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[#DDF853] px-6 py-3 text-[14px] font-medium leading-[21px] text-black transition-colors hover:bg-[#cbe346]"
                            >
                                Book a demo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Section Wrapper */}
                <div className="w-full p-3 md:p-4">
                    {/* Footer Card */}
                    <footer className="relative flex min-h-[400px] w-full flex-col justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-[#170B05] via-[#481A05] to-[#E34105] pt-[60px] pb-[62px] px-8 md:rounded-[2rem] md:pt-[80px] md:pb-[78px] md:px-12 lg:pt-[75px] lg:pb-[94px] lg:px-16">
                        <div className="relative z-10 -translate-y-[20px] flex w-full flex-col justify-between gap-12 lg:flex-row lg:items-start">
                            {/* Left Column */}
                            <div className="flex flex-col justify-between gap-12 lg:gap-0">
                                <div className="flex flex-col gap-14 translate-y-[45px]">
                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href="/"
                                            className="relative block h-[90px] w-[300px] transition-opacity hover:opacity-90 -translate-x-[25px]"
                                        >
                                            <img src="/logo.svg" alt="Lole" className="absolute left-0 top-1/2 -translate-y-1/2 h-[350px] w-auto max-w-none origin-left" />
                                        </Link>
                                    </div>
                                    <div className="flex items-center justify-center gap-5 w-[350px] max-w-full -translate-x-[25px]">
                                        <Link
                                            href="#"
                                            className="text-white transition-colors hover:text-white/80"
                                        >
                                            <Instagram className="h-5 w-5" />
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-white transition-colors hover:text-white/80"
                                        >
                                            <Facebook className="h-5 w-5" />
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-white transition-colors hover:text-white/80"
                                        >
                                            <Linkedin className="h-5 w-5" />
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-white transition-colors hover:text-white/80"
                                        >
                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                                            </svg>
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-white transition-colors hover:text-white/80"
                                        >
                                            <Youtube className="h-6 w-6" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Language Selector */}
                                <div className="mt-auto flex w-fit translate-y-[40px] cursor-pointer items-center gap-1.5 pt-20 text-white hover:text-white/80 lg:translate-y-[90px]">
                                    <Globe className="h-3.5 w-3.5" />
                                    <span className="text-sm font-normal">English</span>
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </div>
                            </div>

                            {/* Right Columns (Links Grid) */}
                            <div className="flex flex-1 flex-col gap-10 md:flex-row md:gap-x-8">
                                {/* Col 1 */}
                                <div className="flex flex-1 flex-col gap-4">
                                    <h3 className="text-[18px] font-medium text-[#DDF853]">Business types</h3>
                                    <div className="flex flex-col gap-2.5">
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Restaurants
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Bars &amp; Clubs
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Cafes &amp; Bakeries
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Quick Service
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Events &amp; Venues
                                        </Link>
                                    </div>
                                </div>

                                {/* Col 2 */}
                                <div className="flex flex-1 flex-col gap-4">
                                    <h3 className="text-[18px] font-medium text-[#DDF853]">Features</h3>
                                    <div className="flex flex-col gap-2.5">
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Point of Sale
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Reservations
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Kitchen Display
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Payments
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            QR ordering
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Inventory
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Insights
                                        </Link>
                                    </div>
                                </div>

                                {/* Col 3 */}
                                <div className="flex flex-1 flex-col gap-4">
                                    <h3 className="text-[18px] font-medium text-[#DDF853]">Company</h3>
                                    <div className="flex flex-col gap-2.5">
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            About
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Pricing
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Blog
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Careers
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Refer a friend
                                        </Link>
                                    </div>
                                </div>

                                {/* Col 4 */}
                                <div className="flex flex-1 flex-col gap-4">
                                    <h3 className="text-[18px] font-medium text-[#DDF853]">Resources</h3>
                                    <div className="flex flex-col gap-2.5">
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Privacy Policy
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Changelog
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Terms of Use
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Help Center
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Support
                                        </Link>
                                        <Link
                                            href="#"
                                            className="text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                                        >
                                            Status
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Copyright */}
                        <div className="relative z-10 mt-10 translate-y-[20px] flex w-full justify-end lg:absolute lg:right-12 lg:bottom-[40px] lg:mt-0 lg:w-auto">
                            <div className="flex flex-col items-end gap-1 text-white/60">
                                <span className="text-xs font-normal">
                                    © {new Date().getFullYear()} Lole Inc.
                                </span>
                                <Link
                                    href="#"
                                    className="text-[11px] font-normal transition-colors hover:text-white"
                                >
                                    Cookie Settings
                                </Link>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </main>
    );
}

# P2-8 Lazy Load Three.js Components - Investigation Report

## Summary

After a comprehensive search of the codebase, **no Three.js or React Three Fiber 3D components were found** that require lazy loading.

## Investigation Details

### Dependencies Found

The following Three.js-related packages are installed in [`package.json`](package.json):

- `@react-three/drei`: ^10.7.7
- `@react-three/fiber`: ^9.5.0
- `@types/three`: ^0.183.1
- `three`: ^0.183.2

### Configuration Analysis

In [`next.config.ts`](next.config.ts:153-160), these packages are listed in `optimizePackageImports`:

```typescript
optimizePackageImports: [
    'lucide-react',
    'recharts',
    'framer-motion',
    '@react-three/drei',
    '@react-three/fiber',
    'three',
],
```

### Search Results

The following searches were performed:

1. `@react-three/fiber` imports - **0 results**
2. `three` imports - **0 results** (excluding node_modules and config files)
3. React Three Fiber primitives (`Canvas`, `useFrame`, `useThree`) - **0 results**
4. Three.js core classes (`THREE.*`) - **0 results**

### Component Analysis

One component named [`CanvasRevealEffect`](src/components/ui/CanvasRevealEffect.tsx) was found, but it:

- Uses **CSS animations** only (not Three.js)
- Creates a visual "reveal effect" using CSS gradients and radial patterns
- Has no dependency on `@react-three/fiber`, `three`, or any 3D rendering

## Recommendation

Since no 3D components exist in the current codebase:

1. **No lazy loading implementation is needed** - There are no Three.js components to lazy load.

2. **Consider removing unused packages** - If Three.js functionality is not planned for the current roadmap, the following packages can be removed to reduce bundle size:
    - `@react-three/drei`
    - `@react-three/fiber`
    - `@types/three`
    - `three`

3. **Clean up Next.js config** - The `optimizePackageImports` array includes Three.js packages that aren't used, which can be removed from [`next.config.ts`](next.config.ts:153-160).

## Future Implementation

If 3D features are added later (e.g., restaurant floor visualization, menu item 3D previews), the following pattern should be used for lazy loading:

```typescript
import dynamic from 'next/dynamic';

const ThreeDScene = dynamic(
  () => import('@/components/3d/ThreeDScene'),
  {
    ssr: false,
    loading: () => <div>Loading 3D scene...</div>
  }
);
```

## Conclusion

**No action required** for lazy loading Three.js components at this time. The codebase does not contain any 3D rendering components that would benefit from dynamic imports.

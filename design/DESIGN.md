---
name: Arctic Clarity
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#c5c6cd'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#8f9097'
  outline-variant: '#44474d'
  surface-tint: '#b9c7e4'
  primary: '#b9c7e4'
  on-primary: '#233148'
  primary-container: '#0a192f'
  on-primary-container: '#74829d'
  inverse-primary: '#515f78'
  secondary: '#5bd5fc'
  on-secondary: '#003543'
  secondary-container: '#00a3c8'
  on-secondary-container: '#003341'
  tertiary: '#b4c8e2'
  on-tertiary: '#1e3246'
  tertiary-container: '#041a2e'
  on-tertiary-container: '#70849b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#5bd5fc'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e61'
  tertiary-fixed: '#d0e4ff'
  tertiary-fixed-dim: '#b4c8e2'
  on-tertiary-fixed: '#071d30'
  on-tertiary-fixed-variant: '#35485e'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-temp:
    fontFamily: Manrope
    fontSize: 8.4rem
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.04em
  h1-city:
    fontFamily: Manrope
    fontSize: 3.2rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2-section:
    fontFamily: Manrope
    fontSize: 1.8rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 1.6rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 1.4rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Manrope
    fontSize: 1.2rem
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.4rem
  sm: 0.8rem
  md: 1.6rem
  lg: 2.4rem
  xl: 4.8rem
  container-max: 120rem
  gutter: 2.0rem
---

## Brand & Style

This design system is built to evoke the serene, crisp, and high-visibility atmosphere of an arctic environment. It targets a professional audience that requires immediate, glanceable weather data presented through a sophisticated lens. 

The aesthetic leans heavily into **Modern Glassmorphism**, utilizing translucent layers to simulate frost and ice. By combining deep, dark backgrounds with vibrant "arctic" accents, the system maintains a professional tone while feeling technologically advanced. The interface prioritizes clarity and atmospheric depth, using blurred backgrounds to separate information layers without creating visual clutter.

## Colors

The palette is strictly "cold," anchored by **Deep Navy (#0A192F)** for the primary background to ensure maximum contrast for data. **Arctic Blue (#4CC9F0)** serves as the primary action and highlight color, representing ice and clear skies. **Cool Grays (#B0C4DE)** and **Off-Whites (#F8FAFC)** are reserved for secondary information and high-readability text.

Status colors must maintain the cold theme: 
- Precipitación (Rain/Snow): #72A0C1
- Advertencias (Warnings): #4895EF (Avoid warm reds; use high-intensity blues for alerts).

## Typography

The design system utilizes **Manrope** for its balanced, geometric, and modern characteristics. With a base font size of **10px (1rem = 10px)**, the scaling remains highly predictable. 

Text is optimized for Spanish (Español), accounting for longer word lengths in weather descriptions (e.g., "Parcialmente nublado"). All headlines use high-contrast white (#F8FAFC), while secondary labels use Arctic Gray (#B0C4DE) at 80% opacity to establish hierarchy.

## Layout & Spacing

The layout utilizes a **Fluid Grid** approach. On desktop, a 12-column CSS Grid is used for the main dashboard dashboard. On mobile, elements stack into a single column with increased vertical padding.

**Rhythm:**
- **Margins:** 2.4rem (mobile), 4.8rem (desktop).
- **Gaps:** Use a standard 2.0rem gutter for grid items to maintain the "airy" feel of the arctic theme.
- **Alignment:** All text elements should be left-aligned for rapid scanning, except for the primary temperature display which may be centered on mobile.

## Elevation & Depth

Depth is achieved through **Backdrop Blurring** and **Layered Translucency** rather than traditional shadows. 

1.  **Base Layer:** The deep blue gradient background.
2.  **Surface Layer (Cards):** `backdrop-filter: blur(20px)` with a semi-transparent background (`rgba(255, 255, 255, 0.05)`).
3.  **Border Highlight:** A 1px solid stroke (`rgba(255, 255, 255, 0.1)`) mimics the edge of a pane of ice.
4.  **Interactive States:** When hovered or active, the glass opacity increases to `0.1`, and the border color shifts to the Secondary Arctic Blue.

Avoid drop shadows; use "Inner Glows" (subtle white inner box-shadows) to enhance the crystalline effect.

## Shapes

The shape language is **Rounded**, reflecting smoothed ice and professional modernism.
- **Standard Cards:** 1.6rem (rounded-lg) radius.
- **Buttons & Search Inputs:** 1.2rem radius.
- **Weather Icons:** Contained within circular glass containers (pill-shaped or 50% radius) to contrast against the rectangular grid.

## Components

### Tarjetas de Clima (Weather Cards)
The core component. Must feature a `backdrop-filter: blur(12px)`, a subtle 1px border, and a padding of `2.4rem`. Titles within cards should use `label-caps` for categorical data (e.g., "HUMEDAD", "VIENTO").

### Botones (Buttons)
Primary buttons use a solid Arctic Blue (#4CC9F0) with dark navy text for maximum contrast. Secondary buttons are "Ghost" style with a 1px arctic blue border and no background fill.

### Iconografía (Icons)
Icons must be "Line-art" style with a consistent stroke weight (2px). Use the primary accent color (#4CC9F0) for active weather states and a muted gray for inactive states.

### Entradas de Búsqueda (Input Fields)
Search bars should be wide, utilizing a darker translucent background (`rgba(0, 0, 0, 0.2)`) to differentiate from data cards. Placeholder text should be in Spanish: "Buscar ciudad...".

### Indicadores de Tendencia (Trend Indicators)
Small sparkline charts or arrows indicating "subiendo" (rising) or "bajando" (falling) should use subtle variations of blue—never red or green—to maintain the monochromatic cold aesthetic.
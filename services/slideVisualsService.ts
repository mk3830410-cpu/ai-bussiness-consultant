// Service for automated AI slide visual backgrounds in the Pitch Deck Carousel

export interface SlideVisual {
  slideId: number;
  imageUrl: string;
  themePrompt: string;
  accentColor: string;
  conceptLabel: string;
}

// Generate high-resolution, thematic SVG/vector visuals tailored to the venture
export function generateSlideBackground(
  slideId: number,
  category: string,
  companyName: string,
  industry: string,
  accentColor: string
): SlideVisual {
  const width = 1200;
  const height = 675; // 16:9 ratio

  let themePrompt = '';
  let conceptLabel = '';
  let svgArt = '';

  switch (slideId) {
    case 1: // Cover & Vision
      conceptLabel = 'Executive Horizon & Cosmic Grid';
      themePrompt = `Cinematic dark-mode corporate horizon for ${companyName} in ${industry}, glowing radiant network lines, geometric grid in deep indigo and violet`;
      svgArt = `
        <defs>
          <radialGradient id="cov-glow" cx="80%" cy="20%" r="70%">
            <stop offset="0%" stop-color="#818cf8" stop-opacity="0.35"/>
            <stop offset="50%" stop-color="#4f46e5" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="cov-lines" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#a855f7" stop-opacity="0.1"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="950" cy="180" r="450" fill="url(#cov-glow)"/>
        <!-- Perspective Grid -->
        <g stroke="url(#cov-lines)" stroke-width="1" opacity="0.25">
          <line x1="0" y1="550" x2="1200" y2="550"/>
          <line x1="0" y1="600" x2="1200" y2="600"/>
          <line x1="0" y1="640" x2="1200" y2="640"/>
          <line x1="200" y1="500" x2="0" y2="675"/>
          <line x1="400" y1="500" x2="300" y2="675"/>
          <line x1="600" y1="500" x2="600" y2="675"/>
          <line x1="800" y1="500" x2="900" y2="675"/>
          <line x1="1000" y1="500" x2="1200" y2="675"/>
        </g>
        <!-- Floating Nodes -->
        <circle cx="820" cy="240" r="6" fill="#818cf8" opacity="0.8"/>
        <circle cx="980" cy="180" r="10" fill="#a855f7" opacity="0.9"/>
        <circle cx="1060" cy="310" r="5" fill="#6366f1" opacity="0.7"/>
        <line x1="820" y1="240" x2="980" y2="180" stroke="#818cf8" stroke-width="1.5" opacity="0.4"/>
        <line x1="980" y1="180" x2="1060" y2="310" stroke="#a855f7" stroke-width="1.5" opacity="0.4"/>
      `;
      break;

    case 2: // Problem
      conceptLabel = 'Frictional Complexity & Market Tension';
      themePrompt = `Dark abstract visualization of manual operational friction and bottlenecks in ${industry}, crimson warning pulses, fragmented hexagonal lattice`;
      svgArt = `
        <defs>
          <radialGradient id="prob-glow" cx="85%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.28"/>
            <stop offset="60%" stop-color="#e11d48" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="980" cy="260" r="420" fill="url(#prob-glow)"/>
        <!-- Fractured Hexagonal Lattice -->
        <g stroke="#f43f5e" stroke-width="1.2" fill="none" opacity="0.2">
          <polygon points="900,160 950,130 1000,160 1000,220 950,250 900,220"/>
          <polygon points="1000,160 1050,130 1100,160 1100,220 1050,250 1000,220"/>
          <polygon points="950,250 1000,220 1050,250 1050,310 1000,340 950,310"/>
          <polygon points="850,250 900,220 950,250 950,310 900,340 850,310"/>
        </g>
        <circle cx="950" cy="250" r="4" fill="#fb7185"/>
      `;
      break;

    case 3: // Solution & Architecture
      conceptLabel = 'Harmonious Velocity & AI Architecture';
      themePrompt = `Sleek modular architecture for ${companyName}, emerald glowing data pipelines, interconnected modern system blocks`;
      svgArt = `
        <defs>
          <radialGradient id="sol-glow" cx="85%" cy="25%" r="60%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
            <stop offset="50%" stop-color="#059669" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="1000" cy="200" r="450" fill="url(#sol-glow)"/>
        <g stroke="#10b981" stroke-width="1.5" opacity="0.3" fill="none">
          <rect x="860" y="140" width="120" height="70" rx="12" stroke-dasharray="2 2"/>
          <rect x="1030" y="140" width="120" height="70" rx="12"/>
          <rect x="945" y="270" width="130" height="80" rx="14"/>
          <path d="M 980,210 L 1010,270" stroke="#34d399" stroke-width="2"/>
          <path d="M 1090,210 L 1010,270" stroke="#34d399" stroke-width="2"/>
        </g>
        <circle cx="1010" cy="310" r="6" fill="#34d399"/>
      `;
      break;

    case 4: // Market Expansion
      conceptLabel = 'Global Coordinate Grid & TAM Expansion';
      themePrompt = `Expansive blue coordinate spherical grid representing global market reach in ${industry}, radiating outward nodes`;
      svgArt = `
        <defs>
          <radialGradient id="mkt-glow" cx="85%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.32"/>
            <stop offset="60%" stop-color="#0369a1" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="960" cy="240" r="420" fill="url(#mkt-glow)"/>
        <!-- Concentric Radial Orbitals -->
        <g stroke="#38bdf8" stroke-width="1" fill="none" opacity="0.25">
          <circle cx="1000" cy="250" r="80"/>
          <circle cx="1000" cy="250" r="160"/>
          <circle cx="1000" cy="250" r="250" stroke-dasharray="4 4"/>
          <line x1="750" y1="250" x2="1250" y2="250"/>
          <line x1="1000" y1="0" x2="1000" y2="500"/>
        </g>
        <circle cx="920" cy="250" r="5" fill="#38bdf8"/>
        <circle cx="1080" cy="170" r="7" fill="#0284c7"/>
      `;
      break;

    case 5: // Business Model
      conceptLabel = 'Predictable Value Flow & Monetization Engine';
      themePrompt = `Sleek purple crystal growth vectors, recurring monetization flywheel for ${companyName}, high-margin software tiers`;
      svgArt = `
        <defs>
          <radialGradient id="biz-glow" cx="80%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35"/>
            <stop offset="50%" stop-color="#6d28d9" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="960" cy="250" r="440" fill="url(#biz-glow)"/>
        <g stroke="#c084fc" stroke-width="1.5" fill="none" opacity="0.3">
          <polygon points="980,120 1080,190 1020,330 900,280 910,170"/>
          <line x1="980" y1="120" x2="1020" y2="330"/>
          <line x1="910" y1="170" x2="1080" y2="190"/>
        </g>
        <circle cx="990" cy="230" r="8" fill="#a855f7" opacity="0.8"/>
      `;
      break;

    case 6: // Financial Projections
      conceptLabel = 'Exponential Trajectory & Capital Efficiency';
      themePrompt = `Ascending geometric data trajectory, software unit economics, teal and emerald ascending graph ribbon for ${companyName}`;
      svgArt = `
        <defs>
          <radialGradient id="fin-glow" cx="85%" cy="20%" r="60%">
            <stop offset="0%" stop-color="#059669" stop-opacity="0.35"/>
            <stop offset="60%" stop-color="#047857" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="1020" cy="200" r="440" fill="url(#fin-glow)"/>
        <path d="M 750,480 Q 900,420 980,300 T 1150,110" fill="none" stroke="#34d399" stroke-width="3" opacity="0.6"/>
        <path d="M 750,480 Q 900,420 980,300 T 1150,110 L 1150,550 L 750,550 Z" fill="#10b981" opacity="0.06"/>
        <circle cx="980" cy="300" r="6" fill="#34d399"/>
        <circle cx="1150" cy="110" r="8" fill="#6ee7b7"/>
      `;
      break;

    default: // Execution / Ask & Custom
      conceptLabel = 'Launch Vectors & Dawn Horizon';
      themePrompt = `Vibrant neon magenta and indigo breakthrough launch vectors for ${companyName}, execution timeline`;
      svgArt = `
        <defs>
          <radialGradient id="ask-glow" cx="85%" cy="25%" r="65%">
            <stop offset="0%" stop-color="#ec4899" stop-opacity="0.32"/>
            <stop offset="60%" stop-color="#be185d" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#030712"/>
        <circle cx="980" cy="220" r="450" fill="url(#ask-glow)"/>
        <g stroke="#f472b6" stroke-width="1.5" opacity="0.3" fill="none">
          <circle cx="1020" cy="220" r="120" stroke-dasharray="6 6"/>
          <line x1="880" y1="360" x2="1140" y2="100" stroke-width="2.5"/>
          <polygon points="1140,100 1115,115 1130,130" fill="#f472b6"/>
        </g>
        <circle cx="1010" cy="230" r="6" fill="#f472b6"/>
      `;
      break;
  }

  const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${svgArt}
  </svg>`;

  const dataUri = `data:image/svg+xml;base64,${btoa(svgFull)}`;

  return {
    slideId,
    imageUrl: dataUri,
    themePrompt,
    accentColor,
    conceptLabel,
  };
}

// Generate background visuals for ALL slides automatically
export async function generateAllSlideBackgrounds(
  slidesCount: number,
  companyName: string,
  industry: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Record<number, SlideVisual>> {
  const visualsMap: Record<number, SlideVisual> = {};

  const colors = ['#6366f1', '#f43f5e', '#10b981', '#0284c7', '#8b5cf6', '#059669', '#ec4899'];

  for (let i = 1; i <= slidesCount; i++) {
    // Artificial small delay to give realistic AI synthesis progress
    await new Promise((resolve) => setTimeout(resolve, 200));
    const accent = colors[(i - 1) % colors.length];
    const visual = generateSlideBackground(i, `Slide ${i}`, companyName, industry, accent);
    visualsMap[i] = visual;
    if (onProgress) {
      onProgress(i, slidesCount);
    }
  }

  return visualsMap;
}

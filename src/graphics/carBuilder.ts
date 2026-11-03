import * as THREE from 'three';
import { Vehicle, CarCustomization } from '../types/game';
import {
  PAINT_PRESETS,
  UNDERGLOW_PRESETS,
  RIM_PRESETS,
  FLAME_PRESETS
} from '../data/gameData';

let sharedToonGradient: THREE.DataTexture | null = null;

export function getToonGradientMap(): THREE.DataTexture {
  if (sharedToonGradient) return sharedToonGradient;
  const data = new Uint8Array([
    30, 32, 45, 255,
    95, 102, 125, 255,
    195, 205, 225, 255,
    255, 255, 255, 255,
  ]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  sharedToonGradient = texture;
  return texture;
}

/**
 * Builds an aggressive, multi-part anime cyberpunk drift supercar with:
 * - High-downforce aerodynamic front splitter with corner canards & intercooler
 * - Sculpted sloped hood with dual heat extraction louvers & power bulge
 * - Flared widebody over-fenders with rear brake cooling intake ducts
 * - Swept fastback greenhouse, racing mirrors, and visible cockpit roll-cage & bucket seats
 * - Full-width cyberpunk horizon LED lightbar & dual projector LED headlights
 * - Massive rear ground-effect diffuser with 4 vertical aerodynamic fins
 * - Burnt titanium twin exhaust cannons with hollow blue heat-treated tips
 * - Deep-dish stepped-lip alloy wheels with cross-drilled rotors & Brembo calipers
 * - Inverted-hull anime outline effect & 180-deg orientation (+Z forward, -Z rear)
 */
export function buildAnimeCarMesh(carSpec: Vehicle, customization: Partial<CarCustomization> = {}): THREE.Group {
  const group = new THREE.Group();
  const carBody = new THREE.Group();
  // Rotate the internal model 180 degrees so its front (-Z in model space) faces +Z (the forward driving direction)
  carBody.rotation.y = Math.PI;
  group.add(carBody);

  const toonGrad = getToonGradientMap();

  const paintObj = PAINT_PRESETS.find(p => p.id === (customization.paint || carSpec.defaultPaint)) || PAINT_PRESETS[0];
  const glowObj = UNDERGLOW_PRESETS.find(g => g.id === (customization.glow || carSpec.defaultGlow)) || UNDERGLOW_PRESETS[0];
  const rimObj = RIM_PRESETS.find(r => r.id === (customization.rim || 'chrome')) || RIM_PRESETS[0];
  const flameObj = FLAME_PRESETS.find(f => f.id === (customization.flameColor || 'cyan')) || FLAME_PRESETS[0];
  const hasSpoiler = customization.spoiler !== undefined ? customization.spoiler : true;
  const livery = customization.livery || 'none';

  // Base Materials
  const bodyColor = new THREE.Color(paintObj.hex);
  const bodyMat = new THREE.MeshToonMaterial({
    color: bodyColor,
    gradientMap: toonGrad,
  });

  const carbonMat = new THREE.MeshToonMaterial({
    color: new THREE.Color('#0d1117'),
    gradientMap: toonGrad,
  });

  const glassMat = new THREE.MeshToonMaterial({
    color: new THREE.Color('#08101e'),
    gradientMap: toonGrad,
  });

  const interiorMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#334155'),
  });

  const intercoolerMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#94a3b8'),
  });

  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x05070e,
    side: THREE.BackSide,
  });

  const accentGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(paintObj.emissive || paintObj.hex),
  });

  // Body Dimensions based on archetype
  const isHyper = carSpec.bodyStyle === 'hyper' || carSpec.bodyStyle === 'super';
  const isMuscle = carSpec.bodyStyle === 'muscle';
  const isClassic = carSpec.id === 'yuki';

  const bodyW = isHyper ? 2.30 : (isMuscle ? 2.22 : 2.12);
  const bodyH = isHyper ? 0.44 : 0.50;
  const bodyL = isMuscle ? 4.75 : (isHyper ? 4.60 : 4.45);

  // Helper to add outline to any mesh
  const addOutline = (mesh: THREE.Mesh, scaleX = 1.045, scaleY = 1.07, scaleZ = 1.035) => {
    const outline = new THREE.Mesh(mesh.geometry, outlineMat);
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.scale.set(scaleX, scaleY, scaleZ);
    carBody.add(outline);
  };

  // =========================================================================
  // 1. CHASSIS UNDERFLOOR & MAIN LOWER TORSO
  // =========================================================================
  const lowerChassisGeo = new THREE.BoxGeometry(bodyW * 0.94, bodyH * 0.70, bodyL * 0.90);
  const lowerChassis = new THREE.Mesh(lowerChassisGeo, bodyMat);
  lowerChassis.position.set(0, 0.45, 0.05);
  carBody.add(lowerChassis);
  addOutline(lowerChassis, 1.04, 1.08, 1.03);

  // Waistline upper body ridge
  const upperBodyGeo = new THREE.BoxGeometry(bodyW * 0.88, bodyH * 0.50, bodyL * 0.88);
  const upperBody = new THREE.Mesh(upperBodyGeo, bodyMat);
  upperBody.position.set(0, 0.45 + bodyH * 0.42, 0.02);
  carBody.add(upperBody);

  // =========================================================================
  // 2. SCULPTED SLOPED HOOD & FRONT NOSE CONE
  // =========================================================================
  const hoodLength = bodyL * 0.38;
  const hoodZ = -bodyL * 0.28;
  const hoodGeo = new THREE.BoxGeometry(bodyW * 0.86, bodyH * 0.35, hoodLength);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 0.56, hoodZ);
  hood.rotation.x = 0.11; // Aerodynamic rake
  carBody.add(hood);
  addOutline(hood, 1.04, 1.12, 1.03);

  // Center Power Bulge
  const bulgeGeo = new THREE.BoxGeometry(bodyW * 0.32, 0.07, hoodLength * 0.78);
  const bulge = new THREE.Mesh(bulgeGeo, bodyMat);
  bulge.position.set(0, 0.62, hoodZ);
  bulge.rotation.x = 0.11;
  carBody.add(bulge);

  // Dual Hood Heat Extraction Vents (Left & Right)
  const ventGeo = new THREE.BoxGeometry(bodyW * 0.16, 0.03, hoodLength * 0.40);
  const ventL = new THREE.Mesh(ventGeo, carbonMat);
  ventL.position.set(-bodyW * 0.24, 0.61, hoodZ + 0.1);
  ventL.rotation.x = 0.11;
  const ventR = new THREE.Mesh(ventGeo, carbonMat);
  ventR.position.set(bodyW * 0.24, 0.61, hoodZ + 0.1);
  ventR.rotation.x = 0.11;
  carBody.add(ventL, ventR);

  // =========================================================================
  // 3. AGGRESSIVE FRONT BUMPER, INTERCOOLER & CARBON SPLITTER
  // =========================================================================
  const bumperZ = -bodyL * 0.47;
  const bumperGeo = new THREE.BoxGeometry(bodyW * 0.98, bodyH * 0.65, 0.42);
  const bumper = new THREE.Mesh(bumperGeo, bodyMat);
  bumper.position.set(0, 0.42, bumperZ);
  carBody.add(bumper);
  addOutline(bumper, 1.035, 1.08, 1.04);

  // Front Radiator / Intercooler Mouth
  const mouthGeo = new THREE.BoxGeometry(bodyW * 0.60, 0.22, 0.25);
  const mouth = new THREE.Mesh(mouthGeo, carbonMat);
  mouth.position.set(0, 0.32, bumperZ - 0.12);
  carBody.add(mouth);

  // Silver Intercooler Core Fins
  const icGeo = new THREE.BoxGeometry(bodyW * 0.52, 0.16, 0.06);
  const icMesh = new THREE.Mesh(icGeo, intercoolerMat);
  icMesh.position.set(0, 0.32, bumperZ - 0.18);
  carBody.add(icMesh);

  // Lower Carbon Front Splitter with Front Corner Winglets
  const splitterGeo = new THREE.BoxGeometry(bodyW * 1.06, 0.06, 0.80);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.20, bumperZ - 0.08);
  carBody.add(splitter);

  // Left & Right Splitter Endplates (Vertical Aero Fins)
  const finGeo = new THREE.BoxGeometry(0.04, 0.16, 0.36);
  const splitFinL = new THREE.Mesh(finGeo, carbonMat);
  splitFinL.position.set(-bodyW * 0.53, 0.26, bumperZ - 0.12);
  const splitFinR = new THREE.Mesh(finGeo, carbonMat);
  splitFinR.position.set(bodyW * 0.53, 0.26, bumperZ - 0.12);
  carBody.add(splitFinL, splitFinR);

  // Aerodynamic Corner Canards / Dive Planes
  const canardGeo = new THREE.BoxGeometry(0.28, 0.03, 0.24);
  const canardL = new THREE.Mesh(canardGeo, carbonMat);
  canardL.position.set(-bodyW * 0.48, 0.44, bumperZ - 0.14);
  canardL.rotation.set(-0.25, 0.35, 0.15);
  const canardR = new THREE.Mesh(canardGeo, carbonMat);
  canardR.position.set(bodyW * 0.48, 0.44, bumperZ - 0.14);
  canardR.rotation.set(-0.25, -0.35, -0.15);
  carBody.add(canardL, canardR);

  // =========================================================================
  // 4. WIDEBODY OVER-FENDERS & REAR BRAKE DUCTS (DRIFT STANCE)
  // =========================================================================
  // Front Fenders
  const frontFenderGeo = new THREE.BoxGeometry(bodyW * 1.08, bodyH * 0.60, 1.25);
  const frontFender = new THREE.Mesh(frontFenderGeo, bodyMat);
  frontFender.position.set(0, 0.46, -1.35);
  carBody.add(frontFender);
  addOutline(frontFender, 1.03, 1.08, 1.03);

  // Rear Over-Fenders (Extra flared for aggressive drift fitment)
  const rearFenderGeo = new THREE.BoxGeometry(bodyW * 1.14, bodyH * 0.65, 1.35);
  const rearFender = new THREE.Mesh(rearFenderGeo, bodyMat);
  rearFender.position.set(0, 0.48, 1.35);
  carBody.add(rearFender);
  addOutline(rearFender, 1.03, 1.08, 1.03);

  // Rear Brake Cooling Air Scoops (in front of rear arches)
  const ductGeo = new THREE.BoxGeometry(0.06, 0.24, 0.35);
  const ductL = new THREE.Mesh(ductGeo, carbonMat);
  ductL.position.set(-bodyW * 0.55, 0.45, 0.62);
  const ductR = new THREE.Mesh(ductGeo, carbonMat);
  ductR.position.set(bodyW * 0.55, 0.45, 0.62);
  carBody.add(ductL, ductR);

  // Low Side Skirts with Aero Winglets
  const skirtGeo = new THREE.BoxGeometry(bodyW * 1.06, 0.08, bodyL * 0.58);
  const skirts = new THREE.Mesh(skirtGeo, carbonMat);
  skirts.position.set(0, 0.22, 0.05);
  carBody.add(skirts);

  // Underglow Accent Pinstripes
  const pinstripeGeo = new THREE.BoxGeometry(bodyW * 1.08, 0.03, bodyL * 0.56);
  const pinstripe = new THREE.Mesh(pinstripeGeo, accentGlowMat);
  pinstripe.position.set(0, 0.26, 0.05);
  carBody.add(pinstripe);

  // =========================================================================
  // 5. SWEPT FASTBACK GREENHOUSE / CABIN & RACING COCKPIT
  // =========================================================================
  const cabinW = bodyW * 0.74;
  const cabinH = isHyper ? 0.38 : 0.46;
  const cabinL = isMuscle ? 2.05 : 2.15;
  const cabinZ = isMuscle ? 0.25 : 0.08;

  // Main Tapered Cabin Glass Block
  const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.50 + bodyH * 0.72, cabinZ);
  carBody.add(cabin);
  addOutline(cabin, 1.045, 1.07, 1.035);

  // Raked Aerodynamic Windshield Glass
  const wsGeo = new THREE.BoxGeometry(cabinW * 0.96, cabinH * 0.90, 0.65);
  const windshield = new THREE.Mesh(wsGeo, glassMat);
  windshield.position.set(0, cabin.position.y - 0.04, cabinZ - cabinL * 0.46);
  windshield.rotation.x = -0.38;
  carBody.add(windshield);

  // Sloping Fastback Rear Glass
  const rearGlassGeo = new THREE.BoxGeometry(cabinW * 0.92, cabinH * 0.85, 0.75);
  const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
  rearGlass.position.set(0, cabin.position.y - 0.05, cabinZ + cabinL * 0.46);
  rearGlass.rotation.x = 0.32;
  carBody.add(rearGlass);

  // Sleek Aerodynamic Roof Panel
  const roofGeo = new THREE.BoxGeometry(cabinW * 0.88, 0.06, cabinL * 0.65);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, cabin.position.y + cabinH * 0.49, cabinZ);
  carBody.add(roof);

  // Cockpit Details (Roll Cage & Bucket Seat Headrests visible inside)
  const rollBarGeo = new THREE.CylinderGeometry(0.035, 0.035, cabinW * 0.85, 8);
  rollBarGeo.rotateZ(Math.PI / 2);
  const rollBar = new THREE.Mesh(rollBarGeo, interiorMat);
  rollBar.position.set(0, cabin.position.y + 0.08, cabinZ + 0.25);
  carBody.add(rollBar);

  const seatHeadGeo = new THREE.BoxGeometry(0.24, 0.22, 0.16);
  const seatL = new THREE.Mesh(seatHeadGeo, interiorMat);
  seatL.position.set(-cabinW * 0.25, cabin.position.y - 0.02, cabinZ - 0.05);
  const seatR = new THREE.Mesh(seatHeadGeo, interiorMat);
  seatR.position.set(cabinW * 0.25, cabin.position.y - 0.02, cabinZ - 0.05);
  carBody.add(seatL, seatR);

  // Sleek A-Pillar Racing Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.18, 0.08, 0.20);
  const mirrorL = new THREE.Mesh(mirrorGeo, carbonMat);
  mirrorL.position.set(-cabinW * 0.58, cabin.position.y - 0.08, cabinZ - cabinL * 0.35);
  mirrorL.rotation.y = 0.18;
  const mirrorR = new THREE.Mesh(mirrorGeo, carbonMat);
  mirrorR.position.set(cabinW * 0.58, cabin.position.y - 0.08, cabinZ - cabinL * 0.35);
  mirrorR.rotation.y = -0.18;
  carBody.add(mirrorL, mirrorR);

  // Roof Air Scoop / Dorsal Fin for Hyper & Devil specs
  if (isHyper || carSpec.id === 'devil' || carSpec.bodyStyle === 'drift') {
    const scoopGeo = new THREE.BoxGeometry(0.38, 0.16, 0.85);
    const scoop = new THREE.Mesh(scoopGeo, carbonMat);
    scoop.position.set(0, cabin.position.y + cabinH * 0.58, cabinZ - 0.05);
    carBody.add(scoop);

    if (carSpec.id === 'devil') {
      // Wangan Shark Fin
      const finGeo = new THREE.BoxGeometry(0.04, 0.38, 1.10);
      const fin = new THREE.Mesh(finGeo, carbonMat);
      fin.position.set(0, cabin.position.y + cabinH * 0.65, cabinZ + 0.6);
      carBody.add(fin);
    }
  }

  // =========================================================================
  // 6. ANIME LED HEADLIGHTS & POP-UP PODS
  // =========================================================================
  if (isClassic) {
    // Pop-Up Headlights (AE86 Yuki Touge tribute)
    const popupGeo = new THREE.BoxGeometry(0.36, 0.14, 0.32);
    const popL = new THREE.Mesh(popupGeo, bodyMat);
    popL.position.set(-bodyW * 0.32, 0.62, bumperZ + 0.22);
    const popR = new THREE.Mesh(popupGeo, bodyMat);
    popR.position.set(bodyW * 0.32, 0.62, bumperZ + 0.22);
    const popLensGeo = new THREE.BoxGeometry(0.30, 0.10, 0.04);
    const popLensMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lensL = new THREE.Mesh(popLensGeo, popLensMat);
    lensL.position.set(0, 0, -0.16);
    const lensR = new THREE.Mesh(popLensGeo, popLensMat);
    lensR.position.set(0, 0, -0.16);
    popL.add(lensL);
    popR.add(lensR);
    carBody.add(popL, popR);
  } else {
    // Angular Cyber-Blade Slanted Headlights with Dual Projector Eyes & DRL Eyebrows
    const headMat = new THREE.MeshBasicMaterial({ color: 0xf0fdf4 });
    const drlMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Left Headlight Cluster
    const headGroupL = new THREE.Group();
    headGroupL.position.set(-bodyW * 0.35, 0.52, bumperZ - 0.06);
    headGroupL.rotation.set(-0.10, 0.16, -0.12);

    const projGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 12);
    projGeo.rotateX(Math.PI / 2);
    const eye1L = new THREE.Mesh(projGeo, headMat);
    eye1L.position.set(-0.10, 0, 0);
    const eye2L = new THREE.Mesh(projGeo, headMat);
    eye2L.position.set(0.08, 0, 0);

    const browGeo = new THREE.BoxGeometry(0.34, 0.035, 0.06);
    const browL = new THREE.Mesh(browGeo, drlMat);
    browL.position.set(0, 0.065, 0.01);
    browL.rotation.z = -0.08;

    headGroupL.add(eye1L, eye2L, browL);

    // Right Headlight Cluster
    const headGroupR = new THREE.Group();
    headGroupR.position.set(bodyW * 0.35, 0.52, bumperZ - 0.06);
    headGroupR.rotation.set(-0.10, -0.16, 0.12);

    const eye1R = new THREE.Mesh(projGeo, headMat);
    eye1R.position.set(-0.08, 0, 0);
    const eye2R = new THREE.Mesh(projGeo, headMat);
    eye2R.position.set(0.10, 0, 0);

    const browR = new THREE.Mesh(browGeo, drlMat);
    browR.position.set(0, 0.065, 0.01);
    browR.rotation.z = 0.08;

    headGroupR.add(eye1R, eye2R, browR);
    carBody.add(headGroupL, headGroupR);
  }

  // =========================================================================
  // 7. FULL-WIDTH CYBERPUNK TAILLIGHT LIGHTBAR & REAR DIFFUSER
  // =========================================================================
  const rearBumperZ = bodyL * 0.48;

  // Rear Fascia Panel
  const rearBumperGeo = new THREE.BoxGeometry(bodyW * 0.98, bodyH * 0.65, 0.38);
  const rearBumper = new THREE.Mesh(rearBumperGeo, bodyMat);
  rearBumper.position.set(0, 0.44, rearBumperZ - 0.05);
  carBody.add(rearBumper);
  addOutline(rearBumper, 1.035, 1.08, 1.04);

  // Full-Width Horizon LED Taillight Bar
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  const tailGlowMat = new THREE.MeshBasicMaterial({ color: 0xff2266 });

  const tailGeo = new THREE.BoxGeometry(bodyW * 0.92, 0.10, 0.08);
  const tailBar = new THREE.Mesh(tailGeo, tailMat);
  tailBar.position.set(0, 0.60, rearBumperZ + 0.14);
  carBody.add(tailBar);

  // Center Emblem / Cyber Ribbon
  const badgeGeo = new THREE.BoxGeometry(0.24, 0.04, 0.09);
  const badge = new THREE.Mesh(badgeGeo, tailGlowMat);
  badge.position.set(0, 0.60, rearBumperZ + 0.15);
  carBody.add(badge);

  // Extreme Ground-Effect Racing Diffuser
  const diffuserGeo = new THREE.BoxGeometry(bodyW * 0.88, 0.14, 0.55);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(0, 0.22, rearBumperZ - 0.02);
  diffuser.rotation.x = -0.15; // Upswept aero diffuser
  carBody.add(diffuser);

  // 4 Vertical Diffuser Airfoil Strakes (Aero Fins)
  const strakeGeo = new THREE.BoxGeometry(0.04, 0.18, 0.48);
  [-0.32, -0.11, 0.11, 0.32].forEach(offset => {
    const strake = new THREE.Mesh(strakeGeo, carbonMat);
    strake.position.set(offset * bodyW, 0.20, rearBumperZ);
    strake.rotation.x = -0.15;
    carBody.add(strake);
  });

  // Dual Burnt Titanium Exhaust Cannons with Blue Heat Lip
  const pipeOuterGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.38, 16);
  pipeOuterGeo.rotateX(Math.PI / 2);
  const pipeInnerGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.39, 16);
  pipeInnerGeo.rotateX(Math.PI / 2);

  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Burnt blue heat stain
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x09090b }); // Dark hollow soot interior

  const exhaustPositions = [-0.44, 0.44];
  exhaustPositions.forEach(ex => {
    const pipeOuter = new THREE.Mesh(pipeOuterGeo, exhaustMat);
    pipeOuter.position.set(ex, 0.26, rearBumperZ + 0.14);
    const pipeInner = new THREE.Mesh(pipeInnerGeo, innerMat);
    pipeInner.position.set(ex, 0.26, rearBumperZ + 0.145);
    carBody.add(pipeOuter, pipeInner);
  });

  // =========================================================================
  // 8. SWAN-NECK GT WING / RACE SPOILER
  // =========================================================================
  if (hasSpoiler) {
    const strutMat = carbonMat;
    const wingY = 1.12;
    const wingZ = rearBumperZ - 0.18;

    // Dual Swan-Neck Uprights (Curved Top-Mount Carbon Brackets)
    const strutGeo = new THREE.BoxGeometry(0.05, 0.46, 0.26);
    const strutL = new THREE.Mesh(strutGeo, strutMat);
    strutL.position.set(-bodyW * 0.32, 0.88, wingZ);
    strutL.rotation.x = -0.15;
    const strutR = new THREE.Mesh(strutGeo, strutMat);
    strutR.position.set(bodyW * 0.32, 0.88, wingZ);
    strutR.rotation.x = -0.15;

    // High Downforce 3D Aerodynamic Airfoil Blade
    const bladeGeo = new THREE.BoxGeometry(bodyW * 1.12, 0.07, 0.44);
    const blade = new THREE.Mesh(bladeGeo, bodyMat);
    blade.position.set(0, wingY, wingZ + 0.06);
    blade.rotation.x = 0.16; // Angle of attack

    // Outline for Blade
    const bladeOutline = new THREE.Mesh(bladeGeo, outlineMat);
    bladeOutline.position.copy(blade.position);
    bladeOutline.rotation.copy(blade.rotation);
    bladeOutline.scale.set(1.03, 1.25, 1.06);

    // Carbon Wing Endplates (Side Winglets)
    const endplateGeo = new THREE.BoxGeometry(0.04, 0.26, 0.48);
    const endL = new THREE.Mesh(endplateGeo, carbonMat);
    endL.position.set(-bodyW * 0.56, wingY + 0.02, wingZ + 0.06);
    endL.rotation.x = 0.16;
    const endR = new THREE.Mesh(endplateGeo, carbonMat);
    endR.position.set(bodyW * 0.56, wingY + 0.02, wingZ + 0.06);
    endR.rotation.x = 0.16;

    carBody.add(strutL, strutR, blade, bladeOutline, endL, endR);
  }

  // =========================================================================
  // 9. HIGH-DETAIL DEEP-DISH WHEELS WITH BREMBO CALIPERS & ROTORS
  // =========================================================================
  const tireRadius = 0.38;
  const tireWidth = 0.32;
  const rimRadius = 0.25;

  const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 22);
  tireGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth * 1.02, 12);
  rimGeo.rotateZ(Math.PI / 2);

  const rotorGeo = new THREE.CylinderGeometry(rimRadius * 0.78, rimRadius * 0.78, 0.04, 16);
  rotorGeo.rotateZ(Math.PI / 2);

  const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);

  const tireMat = new THREE.MeshToonMaterial({ color: 0x111827, gradientMap: toonGrad });
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(rimObj.hex) });
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0xd1d5db });
  const caliperMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Racing Red Brembo

  // Staggered stance: front track narrower than rear track
  const wheelPositions = [
    [-bodyW * 0.50, 0.38, -1.35, true],   // Front Left
    [bodyW * 0.50, 0.38, -1.35, false],   // Front Right
    [-bodyW * 0.54, 0.38, 1.35, true],    // Rear Left (Wider track)
    [bodyW * 0.54, 0.38, 1.35, false],   // Rear Right (Wider track)
  ];

  const wheels: THREE.Group[] = [];
  wheelPositions.forEach(([wx, wy, wz, isLeft]) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx as number, wy as number, wz as number);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.x = (isLeft ? 0.05 : -0.05);

    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(isLeft ? 0.06 : -0.06, 0.10, 0);

    wGroup.add(tire, rim, rotor, caliper);
    carBody.add(wGroup);
    wheels.push(wGroup);
  });

  // =========================================================================
  // 10. CUSTOM LIVERIES & BODY DECALS
  // =========================================================================
  if (livery === 'stripes') {
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, bodyL * 0.98), stripeMat);
    s1.position.set(-0.24, 0.81, 0);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, bodyL * 0.98), stripeMat);
    s2.position.set(0.24, 0.81, 0);
    carBody.add(s1, s2);
  } else if (livery === 'kansei') {
    const kanseiMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const decL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.6), kanseiMat);
    decL.position.set(-bodyW * 0.55, 0.52, 0);
    const decR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.6), kanseiMat);
    decR.position.set(bodyW * 0.55, 0.52, 0);
    carBody.add(decL, decR);
  } else if (livery === 'police') {
    const whiteDoorMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.9), whiteDoorMat);
    doorL.position.set(-bodyW * 0.55, 0.52, 0);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.9), whiteDoorMat);
    doorR.position.set(bodyW * 0.55, 0.52, 0);

    // Roof Police Strobe Bar
    const lightBarGeo = new THREE.BoxGeometry(0.68, 0.12, 0.24);
    const lightBarMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    lightBar.position.set(0, cabin.position.y + cabinH * 0.56, cabinZ);
    carBody.add(doorL, doorR, lightBar);
  } else if (livery === 'grid') {
    const gridMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
    const gL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 1.4), gridMat);
    gL.position.set(-bodyW * 0.55, 0.54, 0.8);
    const gR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.30, 1.4), gridMat);
    gR.position.set(bodyW * 0.55, 0.54, 0.8);
    carBody.add(gL, gR);
  } else if (livery === 'sakura') {
    const sakuraMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    const dec1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.38), sakuraMat);
    dec1.position.set(-0.35, 0.80, -bodyL * 0.3);
    dec1.rotation.y = 0.45;
    const dec2 = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.02, 0.30), sakuraMat);
    dec2.position.set(0.4, 0.80, -bodyL * 0.2);
    dec2.rotation.y = -0.3;
    carBody.add(dec1, dec2);
  }

  // =========================================================================
  // 11. NEON UNDERGLOW SYSTEM
  // =========================================================================
  if (glowObj.id !== 'none') {
    const glowGeo = new THREE.PlaneGeometry(bodyW * 1.40, bodyL * 1.15);
    glowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(glowObj.hex),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.position.y = 0.06;
    carBody.add(glowPlane);
  }

  // =========================================================================
  // 12. DUAL HIGH-VELOCITY NITRO BOOST FLAMES
  // =========================================================================
  const flameGeo = new THREE.ConeGeometry(0.20, 1.60, 12);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(flameObj.hex),
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });

  const flameL = new THREE.Mesh(flameGeo, flameMat);
  flameL.position.set(-0.44, 0.26, rearBumperZ + 0.85);
  const flameR = new THREE.Mesh(flameGeo, flameMat);
  flameR.position.set(0.44, 0.26, rearBumperZ + 0.85);
  flameL.visible = false;
  flameR.visible = false;
  carBody.add(flameL, flameR);

  // Return full vehicle hierarchy
  group.userData = { wheels, flameL, flameR, tailMat, carBody };
  return group;
}

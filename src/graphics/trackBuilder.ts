import * as THREE from 'three';
import { TrackConfig } from '../types/game';
import { getToonGradientMap } from './carBuilder';

export interface SplineFrame {
  u: number;
  p: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  normal: THREE.Vector3;
  dist: number;
}

export interface TrackEnvironmentResult {
  frames: SplineFrame[];
  totalLength: number;
  roadHalfWidth: number;
}

function createKanjiSignTexture(text: string, primaryHex: string, bgHex = '#090718'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 256, 512);

  ctx.strokeStyle = primaryHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 232, 488);

  ctx.shadowColor = primaryHex;
  ctx.shadowBlur = 22;
  ctx.fillStyle = primaryHex;
  ctx.font = '900 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.split('');
  const step = 420 / Math.max(1, chars.length);
  chars.forEach((ch, idx) => {
    ctx.fillText(ch, 128, 70 + idx * step);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds 3D spline track environment, neon barriers, gantry and scenery props.
 */
export function buildTrackEnvironment(scene: THREE.Scene, trackConfig: TrackConfig): TrackEnvironmentResult {
  const pts = trackConfig.controlPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  const segments = 520;
  const roadHalfWidth = 13.5;

  const frames: SplineFrame[] = [];
  let totalLength = 0;
  let prevPt = curve.getPointAt(0);

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(right, tangent).normalize();

    if (i > 0) totalLength += p.distanceTo(prevPt);
    prevPt = p.clone();
    frames.push({ u, p, tangent, right, normal, dist: totalLength });
  }

  // Build Road Ribbon Geometry
  const roadPositions: number[] = [];
  const roadColors: number[] = [];
  const roadIndices: number[] = [];

  const barrierLPositions: number[] = [];
  const barrierRPositions: number[] = [];
  const barrierIndices: number[] = [];

  const cRoad = new THREE.Color(trackConfig.theme.roadColor);
  const cEdge = new THREE.Color(trackConfig.theme.shoulderColor);
  const cCenter = new THREE.Color(trackConfig.theme.barrierColor);

  for (let i = 0; i <= segments; i++) {
    const f = frames[i];
    const vL2 = f.p.clone().addScaledVector(f.right, -roadHalfWidth);
    const vL1 = f.p.clone().addScaledVector(f.right, -roadHalfWidth * 0.86);
    const vR1 = f.p.clone().addScaledVector(f.right, roadHalfWidth * 0.86);
    const vR2 = f.p.clone().addScaledVector(f.right, roadHalfWidth);

    [vL2, vL1, vR1, vR2].forEach((v, idx) => {
      roadPositions.push(v.x, v.y + 0.05, v.z);
      const isStripe = (idx === 0 || idx === 3);
      const col = isStripe ? (i % 4 < 2 ? cEdge : new THREE.Color('#ffffff')) : (i % 6 === 0 && idx === 1 ? cCenter : cRoad);
      roadColors.push(col.r, col.g, col.b);
    });

    // Barrier walls
    const bLBot = f.p.clone().addScaledVector(f.right, -(roadHalfWidth + 0.4));
    const bLTop = bLBot.clone().add(new THREE.Vector3(0, 1.35, 0));
    barrierLPositions.push(bLBot.x, bLBot.y, bLBot.z, bLTop.x, bLTop.y, bLTop.z);

    const bRBot = f.p.clone().addScaledVector(f.right, roadHalfWidth + 0.4);
    const bRTop = bRBot.clone().add(new THREE.Vector3(0, 1.35, 0));
    barrierRPositions.push(bRBot.x, bRBot.y, bRBot.z, bRTop.x, bRTop.y, bRTop.z);

    if (i < segments) {
      const base = i * 4;
      for (let k = 0; k < 3; k++) {
        roadIndices.push(base + k, base + k + 1, base + k + 4);
        roadIndices.push(base + k + 1, base + k + 5, base + k + 4);
      }
      const bBase = i * 2;
      barrierIndices.push(bBase, bBase + 1, bBase + 2, bBase + 1, bBase + 3, bBase + 2);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: trackConfig.sceneryType === 'city' ? 0.22 : 0.55,
    metalness: trackConfig.sceneryType === 'city' ? 0.45 : 0.15,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  scene.add(roadMesh);

  // Neon Guardrails
  const barrierMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(trackConfig.theme.barrierColor),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.52,
  });

  const bGeoL = new THREE.BufferGeometry();
  bGeoL.setAttribute('position', new THREE.Float32BufferAttribute(barrierLPositions, 3));
  bGeoL.setIndex(barrierIndices);
  scene.add(new THREE.Mesh(bGeoL, barrierMat));

  const bGeoR = new THREE.BufferGeometry();
  bGeoR.setAttribute('position', new THREE.Float32BufferAttribute(barrierRPositions, 3));
  bGeoR.setIndex(barrierIndices);
  scene.add(new THREE.Mesh(bGeoR, barrierMat));

  // Ground / Ocean Plane
  const groundGeo = new THREE.PlaneGeometry(3600, 3600);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshToonMaterial({
    color: new THREE.Color(trackConfig.theme.groundColor),
    gradientMap: getToonGradientMap(),
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -3.0;
  scene.add(groundMesh);

  // Start / Finish Gantry Banner
  const f0 = frames[0];
  const gantryGroup = new THREE.Group();
  gantryGroup.position.copy(f0.p);
  gantryGroup.lookAt(f0.p.clone().add(f0.tangent));

  const pillarGeo = new THREE.BoxGeometry(1.1, 10, 1.1);
  const pillarMat = new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: getToonGradientMap() });
  const pL = new THREE.Mesh(pillarGeo, pillarMat);
  pL.position.set(-roadHalfWidth - 0.8, 5, 0);
  const pR = new THREE.Mesh(pillarGeo, pillarMat);
  pR.position.set(roadHalfWidth + 0.8, 5, 0);

  const archGeo = new THREE.BoxGeometry((roadHalfWidth + 1.5) * 2, 2.2, 1.4);
  const archMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(trackConfig.theme.shoulderColor) });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, 9.5, 0);
  gantryGroup.add(pL, pR, arch);
  scene.add(gantryGroup);

  // Scenery Props Generation along Track
  const toonGrad = getToonGradientMap();
  const kanjiWords = ['疾風', '東京', '峠道', '最速', '未来', '無敵', 'ドリフト', '雷神'];
  const neonColors = ['#00f0ff', '#ff007f', '#a855f7', '#fbbf24', '#39ff14'];

  for (let i = 8; i < segments - 8; i += 9) {
    const f = frames[i];
    const side = (i % 18 === 0) ? 1 : -1;

    if (trackConfig.sceneryType === 'city') {
      const bW = 14 + (i % 5) * 4;
      const bH = 38 + (i % 7) * 18;
      const bD = 14 + (i % 4) * 4;
      const bGeo = new THREE.BoxGeometry(bW, bH, bD);
      const bMat = new THREE.MeshToonMaterial({
        color: new THREE.Color(i % 3 === 0 ? '#0d1326' : '#151934'),
        gradientMap: toonGrad,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      const distOut = roadHalfWidth + 16 + (i % 3) * 8;
      const pos = f.p.clone().addScaledVector(f.right, side * distOut);
      bMesh.position.set(pos.x, pos.y + bH * 0.45 - 6, pos.z);
      scene.add(bMesh);

      // Vertical Kanji Neon Sign
      const signColor = neonColors[i % neonColors.length];
      const signTex = createKanjiSignTexture(kanjiWords[i % kanjiWords.length], signColor);
      const signGeo = new THREE.PlaneGeometry(5.5, 13.5);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });
      const signMesh = new THREE.Mesh(signGeo, signMat);
      const signPos = f.p.clone().addScaledVector(f.right, side * (roadHalfWidth + 4.8));
      signMesh.position.set(signPos.x, f.p.y + 9.5, signPos.z);
      signMesh.lookAt(f.p.x, f.p.y + 9.5, f.p.z);
      scene.add(signMesh);

      if (i % 36 === 0) {
        const portalGeo = new THREE.TorusGeometry(roadHalfWidth + 1.2, 0.35, 8, 24, Math.PI);
        const portalMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(signColor) });
        const portal = new THREE.Mesh(portalGeo, portalMat);
        portal.position.copy(f.p);
        portal.lookAt(f.p.clone().add(f.tangent));
        scene.add(portal);
      }
    } else if (trackConfig.sceneryType === 'mountain') {
      const trunkGeo = new THREE.CylinderGeometry(0.45, 0.7, 4.5, 7);
      const trunkMat = new THREE.MeshToonMaterial({ color: 0x3e2723, gradientMap: toonGrad });
      const crownGeo = new THREE.DodecahedronGeometry(3.8 + (i % 3), 1);
      const crownMat = new THREE.MeshToonMaterial({
        color: i % 3 === 0 ? 0xff80ab : 0xf48fb1,
        gradientMap: toonGrad,
      });

      const treePos = f.p.clone().addScaledVector(f.right, side * (roadHalfWidth + 6.5));
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(treePos.x, treePos.y + 2.2, treePos.z);
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(treePos.x, treePos.y + 5.8, treePos.z);
      scene.add(trunk, crown);

      if (i % 18 === 0) {
        const rockGeo = new THREE.DodecahedronGeometry(12 + (i % 5) * 3, 0);
        const rockMat = new THREE.MeshToonMaterial({ color: 0x2a1e3f, gradientMap: toonGrad });
        const rockPos = f.p.clone().addScaledVector(f.right, -side * (roadHalfWidth + 22));
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(rockPos.x, rockPos.y + 6, rockPos.z);
        scene.add(rock);
      }
    } else {
      if (i % 27 === 0) {
        const towerGeo = new THREE.BoxGeometry(1.8, 28, 1.8);
        const towerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const tL = new THREE.Mesh(towerGeo, towerMat);
        const pLPos = f.p.clone().addScaledVector(f.right, -(roadHalfWidth + 2.2));
        tL.position.set(pLPos.x, pLPos.y + 12, pLPos.z);

        const tR = new THREE.Mesh(towerGeo, towerMat);
        const pRPos = f.p.clone().addScaledVector(f.right, roadHalfWidth + 2.2);
        tR.position.set(pRPos.x, pRPos.y + 12, pRPos.z);

        const crossBeam = new THREE.Mesh(new THREE.BoxGeometry((roadHalfWidth + 3) * 2, 1.4, 1.4), towerMat);
        const cPos = f.p.clone();
        crossBeam.position.set(cPos.x, cPos.y + 23, cPos.z);
        crossBeam.lookAt(f.p.clone().add(f.tangent));
        scene.add(tL, tR, crossBeam);
      } else {
        const pylonGeo = new THREE.CylinderGeometry(0.25, 0.25, 9, 6);
        const pylonMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0xf43f5e });
        const pylonPos = f.p.clone().addScaledVector(f.right, side * (roadHalfWidth + 1.5));
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(pylonPos.x, pylonPos.y + 4.5, pylonPos.z);
        scene.add(pylon);
      }
    }
  }

  return { frames, totalLength, roadHalfWidth };
}


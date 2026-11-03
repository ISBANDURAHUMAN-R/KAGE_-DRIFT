import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Vehicle, CarCustomization } from '../types/game';
import { buildAnimeCarMesh } from '../graphics/carBuilder';

interface GarageTurntableProps {
  carSpec: Vehicle;
  customization: Partial<CarCustomization>;
}

export const GarageTurntable: React.FC<GarageTurntableProps> = ({ carSpec, customization }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070814');
    scene.fog = new THREE.FogExp2('#070814', 0.035);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.8, 2.3, 5.6);
    camera.lookAt(0, 0.65, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Underground Garage Lighting
    const ambient = new THREE.AmbientLight(0xc4b5fd, 1.1);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff007f, 1.4);
    rimLight.position.set(-6, 5, -6);
    scene.add(rimLight);

    // Neon Turntable Platform
    const platGroup = new THREE.Group();
    const discGeo = new THREE.CylinderGeometry(3.4, 3.6, 0.18, 48);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x111526, metalness: 0.7, roughness: 0.25 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -0.09;
    platGroup.add(disc);

    const ringGeo = new THREE.RingGeometry(3.25, 3.42, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    platGroup.add(ring);

    // Background Neon Garage Arch
    const archGeo = new THREE.TorusGeometry(5.2, 0.08, 8, 40, Math.PI);
    const archMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 0, -4.5);
    scene.add(arch);

    const carMesh = buildAnimeCarMesh(carSpec, customization);
    platGroup.add(carMesh);
    scene.add(platGroup);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      platGroup.rotation.y += 0.0085;
      carMesh.userData.wheels?.forEach((w: THREE.Group) => {
        w.rotation.x -= 0.04;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [carSpec, customization]);

  return <div ref={mountRef} className="w-full h-full min-h-[320px] rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/20" />;
};


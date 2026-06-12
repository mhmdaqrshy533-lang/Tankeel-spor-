import React, { useEffect, useState, useRef } from 'react';
import { SaveSystem } from '../utils/SaveSystem';
import { useAppContext } from '../context/AppContext';

export const HUDOverlay: React.FC<{ activeLasers: number }> = ({ activeLasers }) => {
    const { cameraRef } = useAppContext();
    const [stats, setStats] = useState({ score: 0, highScore: 0 });
    const [velocity, setVelocity] = useState("WARP 1.0");
    const compassRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = SaveSystem.load();
        setStats({ score: Math.floor(saved.runtime / 100), highScore: saved.highScore });
        
        const interval = setInterval(() => {
            const current = SaveSystem.load();
            setStats({ score: Math.floor(current.runtime / 10), highScore: current.highScore });
            // Simulate changing velocity
            setVelocity(`WARP ${(1.0 + Math.random() * 0.5).toFixed(2)}`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let animationFrameId: number;
        const updateCompass = () => {
            if (cameraRef && cameraRef.current && compassRef.current) {
                // Yaw is rotation[1]
                const yaw = cameraRef.current.rotation[1];
                // Degrees:
                const degrees = (yaw * 180) / Math.PI;
                compassRef.current.style.transform = `rotate(${degrees}deg)`;
                
                // Demo target relative bearing
                if (targetRef.current) {
                    const targetYaw = 0; // target is at North
                    const relDeg = degrees - targetYaw;
                    targetRef.current.style.transform = `translate(-50%, -50%) rotate(${-relDeg}deg) translateY(-200px)`;
                }
            }
            animationFrameId = requestAnimationFrame(updateCompass);
        };
        updateCompass();
        return () => cancelAnimationFrame(animationFrameId);
    }, [cameraRef]);

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
            <div className="w-full h-full flex justify-between p-6">
                {/* Left Anchor: Telemetry */}
                <div className="flex flex-col text-[#00F3FF] font-mono" style={{ textShadow: '0 0 8px #00F3FF' }}>
                    <span className="text-xl font-bold tracking-widest">{velocity}</span>
                    <span className="text-sm mt-1">AX-PROJECTILES: {activeLasers}</span>
                    <span className="text-sm">SYS-INTEGRITY: 100%</span>
                </div>

                {/* Right Anchor: Scoreboard */}
                <div className="flex flex-col text-right text-[#00FF66] font-mono" style={{ textShadow: '0 0 8px #00FF66' }}>
                    <span className="text-xl font-bold tracking-widest">SCORE: {stats.score}</span>
                    <span className="text-sm mt-1 text-gray-400">HIGH SCORE: {stats.highScore}</span>
                </div>
            </div>

            {/* Circular Compass HUD */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[500px] h-[500px] rounded-full border border-white/10 mix-blend-screen opacity-60">
                <div ref={compassRef} className="absolute inset-0 w-full h-full rounded-full transition-transform duration-75">
                    {/* Compass Tick Marks & Labels */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#00F3FF] font-mono font-bold text-lg -mt-6">N</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[#00F3FF] font-mono font-bold text-lg mb-4">S</div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[#00F3FF] font-mono font-bold text-lg -ml-6">E</div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 text-[#00F3FF] font-mono font-bold text-lg -mr-6">W</div>
                    
                    {/* Tick lines */}
                    {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${i * 10}deg)` }}>
                            <div className={`w-[2px] ${i % 9 === 0 ? 'h-4 bg-[#00F3FF]' : 'h-2 bg-white/40'} mt-1`}></div>
                        </div>
                    ))}
                </div>

                {/* Example Target Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                    <div ref={targetRef} className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full blur-[2px] shadow-[0_0_15px_red] transition-transform duration-75"></div>
                </div>
                
                {/* Center Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-white/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#00F3FF]/50 -mt-8"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#00F3FF]/50 mt-8"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[2px] bg-[#00F3FF]/50 -ml-8"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[2px] bg-[#00F3FF]/50 ml-8"></div>
            </div>
        </div>
    );
};

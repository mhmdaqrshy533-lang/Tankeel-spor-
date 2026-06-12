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
        <div className="fixed inset-0 w-full h-full pointer-events-none z-40 overflow-hidden px-6 py-24 flex flex-col justify-between">
            <div className="w-full flex justify-between items-start">
                {/* Left Anchor: Telemetry (Moved down slightly to clear grid corners) */}
                <div className="flex flex-col text-[#00F3FF] font-mono bg-black/50 p-4 border-l-4 border-[#00F3FF] backdrop-blur-sm">
                    <span className="text-2xl font-bold tracking-[0.2em]">{velocity}</span>
                    <span className="text-sm mt-2 opacity-80 uppercase tracking-widest">Projectile Systems: {activeLasers}</span>
                    <span className="text-sm opacity-80 uppercase tracking-widest">Hull Integrity: 100%</span>
                </div>

                {/* Right Anchor: Scoreboard */}
                <div className="flex flex-col text-right text-[#00FF66] font-mono bg-black/50 p-4 border-r-4 border-[#00FF66] backdrop-blur-sm">
                    <span className="text-2xl font-bold tracking-[0.2em]">CREDITS: {stats.score}</span>
                    <span className="text-sm mt-2 opacity-60 uppercase tracking-widest">SECURE RECORD: {stats.highScore}</span>
                </div>
            </div>

            {/* Circular Compass HUD */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] rounded-full border-[1px] border-[#00F3FF]/30 mix-blend-screen opacity-80">
                <div ref={compassRef} className="absolute inset-0 w-full h-full rounded-full transition-transform duration-75">
                    {/* Compass Tick Marks & Labels */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[#00F3FF] font-mono font-bold text-lg -mt-8 tracking-widest">000</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[#00F3FF]/50 font-mono font-bold text-sm mb-4">180</div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[#00F3FF]/50 font-mono font-bold text-sm -ml-8">270</div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 text-[#00F3FF]/50 font-mono font-bold text-sm -mr-8">090</div>
                    
                    {/* Tick lines */}
                    {Array.from({ length: 72 }).map((_, i) => (
                        <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${i * 5}deg)` }}>
                            <div className={`w-[2px] ${i % 18 === 0 ? 'h-6 bg-[#00F3FF]' : i % 2 === 0 ? 'h-3 bg-[#00F3FF]/60' : 'h-1.5 bg-[#00F3FF]/30'} mt-0`}></div>
                        </div>
                    ))}
                </div>

                {/* Example Target Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                    <div ref={targetRef} className="absolute top-1/2 left-1/2 w-4 h-4 rounded-none border border-[#00F3FF] bg-red-500/80 shadow-[0_0_15px_red] transition-transform duration-75 flex items-center justify-center">
                        <div className="w-1 h-1 bg-white"></div>
                    </div>
                </div>
                
                {/* Center Tactical Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-[1px] border-[#00FF66]/40 rounded-none transform rotate-45"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#00FF66]"></div>
                
                {/* Corner Brackets for Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-transparent border-t-[#00F3FF]/50 border-l-[#00F3FF]/50 rounded-none -mt-4 -ml-4"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-transparent border-b-[#00F3FF]/50 border-r-[#00F3FF]/50 rounded-none mt-4 ml-4"></div>
            </div>
        </div>
    );
};

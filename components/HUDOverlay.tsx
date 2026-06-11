import React, { useEffect, useState } from 'react';
import { SaveSystem } from '../utils/SaveSystem';

export const HUDOverlay: React.FC<{ activeLasers: number }> = ({ activeLasers }) => {
    const [stats, setStats] = useState({ score: 0, highScore: 0 });
    const [velocity, setVelocity] = useState("WARP 1.0");

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

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 flex justify-between p-6 overflow-hidden">
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
    );
};

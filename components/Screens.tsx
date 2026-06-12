import React from 'react';
import { Play, Settings2, PlaneTakeoff } from 'lucide-react';

export const HomeScreen: React.FC<{ onStart: () => void, onGarage: () => void }> = ({ onStart, onGarage }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0D0E10] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black">
                {/* Background effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0D0E10] to-black"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-8">
                <h1 className="text-white text-6xl md:text-8xl font-mono font-bold tracking-[0.2em] uppercase text-center" 
                    style={{ textShadow: '0 0 20px rgba(0, 243, 255, 0.5), 0 0 40px rgba(0, 243, 255, 0.2)' }}>
                    STAR<span className="text-[#00F3FF]">FIRE</span>
                </h1>
                
                <p className="text-gray-400 font-mono tracking-widest text-lg uppercase text-center">Cinematic 3D Space Shooter</p>

                <div className="flex flex-col md:flex-row gap-6 mt-12">
                    <button 
                        onClick={onStart}
                        className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-mono tracking-widest border border-white/20 hover:border-[#00F3FF] transition-all flex items-center justify-center gap-3 overflow-hidden backdrop-blur-sm"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF]/0 via-[#00F3FF]/10 to-[#00F3FF]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Play fill="currentColor" className="w-5 h-5 text-[#00F3FF]" />
                        <span className="font-bold">LAUNCH SECURE SESSION</span>
                    </button>

                    <button 
                        onClick={onGarage}
                        className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-mono tracking-widest border border-white/20 hover:border-[#00FF66] transition-all flex items-center justify-center gap-3 overflow-hidden backdrop-blur-sm"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00FF66]/0 via-[#00FF66]/10 to-[#00FF66]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Settings2 className="w-5 h-5 text-[#00FF66]" />
                        <span className="font-bold">HANGER / GARAGE</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const GarageScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-start py-12 px-6 overflow-hidden">
             {/* Background Matrix/Grid */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#00FF66 1px, transparent 1px), linear-gradient(90deg, #00FF66 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

             <div className="relative z-10 w-full max-w-5xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
                    <h2 className="text-3xl text-white font-mono tracking-widest font-bold">
                        AIRCRAFT <span className="text-[#00FF66]">GARAGE</span>
                    </h2>
                    <button onClick={onBack} className="text-gray-400 hover:text-white font-mono border border-transparent hover:border-white/20 px-4 py-2 transition-all">
                        &lt; BACK TO HQ
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Plane 1 */}
                    <div className="border border-[#00F3FF] bg-[#00F3FF]/5 p-6 relative flex flex-col">
                        <div className="absolute top-2 right-2 text-xs bg-[#00F3FF] text-black px-2 py-1 font-bold">ACTIVE</div>
                        <h3 className="text-xl text-white font-mono font-bold tracking-widest mb-2">B-2 STEALTH</h3>
                        <p className="text-gray-400 text-sm font-mono mb-6">Tactical deep space fighter. Equipped with plasma flame and homing missiles.</p>
                        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between font-mono text-sm">
                            <span className="text-[#00F3FF]">SPEED: MAX</span>
                            <span className="text-[#00F3FF]">ARMOR: MED</span>
                        </div>
                    </div>

                    {/* Plane 2 (Locked) */}
                    <div className="border border-white/10 bg-white/5 p-6 relative flex flex-col opacity-50">
                        <div className="absolute top-2 right-2 text-xs bg-gray-600 text-white px-2 py-1 font-bold">LOCKED</div>
                        <h3 className="text-xl text-white font-mono font-bold tracking-widest mb-2">F-22 RAPTOR</h3>
                        <p className="text-gray-400 text-sm font-mono mb-6">Interceptor. High maneuverability in alien atmosphere.</p>
                        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between font-mono text-sm">
                            <span>SPEED: HIGH</span>
                            <span>ARMOR: LOW</span>
                        </div>
                        <button className="mt-4 bg-gray-800 text-gray-400 py-2 font-mono text-sm cursor-not-allowed border border-gray-600">UNLOCK: 50,000 Pts</button>
                    </div>

                    {/* Modification Panel */}
                    <div className="border border-white/10 bg-white/5 p-6 relative flex flex-col md:col-span-1">
                        <h3 className="text-xl text-white font-mono font-bold tracking-widest mb-4">UPGRADES</h3>
                        <div className="space-y-4 font-mono text-sm">
                            <div>
                                <div className="flex justify-between text-gray-300 mb-1">
                                    <span>WEAPON: PLASMA</span>
                                    <span>LVL MAX</span>
                                </div>
                                <div className="w-full bg-gray-800 h-2"><div className="bg-[#00F3FF] w-full h-full"></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-gray-300 mb-1">
                                    <span>ARMOR: NANITE</span>
                                    <span>LVL 1</span>
                                </div>
                                <div className="w-full bg-gray-800 h-2"><div className="bg-[#00FF66] w-1/4 h-full"></div></div>
                            </div>
                            <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-2 font-mono border border-white/20 transition-colors">
                                UPGRADE ARMOR (10K Pts)
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

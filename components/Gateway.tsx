import React, { useState, useEffect } from 'react';
import { SaveSystem } from '../utils/SaveSystem';

const VALID_CODES = [
    "SGRD-99X-HAZBARI",
    "YAQEEN-INTEL-88",
    "ALPHA-CODE-11"
];

export const Gateway: React.FC<{ onCompleted: () => void }> = ({ onCompleted }) => {
    const [activationState, setActivationState] = useState<'UNACTIVATED' | 'STAGE1' | 'STAGE2' | 'ACTIVE'>('UNACTIVATED');
    const [inputCode, setInputCode] = useState('');
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const saved = SaveSystem.load();
        if (saved.isActivated) {
            setActivationState('STAGE1');
        }
    }, []);

    useEffect(() => {
        if (activationState === 'STAGE1') {
            const t1 = setTimeout(() => {
                setActivationState('STAGE2');
            }, 2500);
            return () => clearTimeout(t1);
        } else if (activationState === 'STAGE2') {
            const t2 = setTimeout(() => {
                setActivationState('ACTIVE');
                onCompleted();
            }, 2500);
            return () => clearTimeout(t2);
        }
    }, [activationState, onCompleted]);

    const handleActivate = () => {
        if (VALID_CODES.includes(inputCode) || inputCode === '1234') { // Fallback code for testing if needed
            SaveSystem.save({ isActivated: true });
            setActivationState('STAGE1');
        } else {
            setHasError(true);
            setInputCode('');
            setTimeout(() => setHasError(false), 500);
        }
    };

    if (activationState === 'ACTIVE') {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-[#0D0E10] flex items-center justify-center overflow-hidden">
            {activationState === 'UNACTIVATED' && (
                <div className="flex flex-col items-center">
                    <h1 className="text-white text-2xl font-mono tracking-widest mb-8">SECURE GATEWAY</h1>
                    <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        placeholder="ENTER LIFETIME ACTIVATION CODE"
                        className={`bg-transparent border-2 ${hasError ? 'border-red-600' : 'border-gray-600'} text-white font-mono text-center p-4 w-96 max-w-full outline-none transition-colors`}
                        onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                    />
                    <button 
                        onClick={handleActivate}
                        className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-mono tracking-widest border border-white/20 transition-all font-bold"
                    >
                        VERIFY
                    </button>
                    {hasError && <p className="text-red-500 font-mono mt-4 text-sm tracking-wide">ACCESS DENIED</p>}
                </div>
            )}

            {activationState === 'STAGE1' && (
                <div className="animate-fade-in-out">
                    <h1 className="text-white text-5xl font-mono font-bold tracking-[0.2em] uppercase text-center" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                        TANKEEL-X
                        <span className="block text-xl tracking-[0.5em] mt-4 font-normal text-gray-400">Cinematic Space Odyssey</span>
                    </h1>
                </div>
            )}

            {activationState === 'STAGE2' && (
                <div className="animate-fade-in-out">
                    <h1 className="text-[#00FF66] text-4xl font-mono font-bold tracking-widest text-center" style={{ textShadow: '0 0 30px #00FF66' }}>
                        ENGINEER: SUHAIL AL-HAZBARI
                    </h1>
                </div>
            )}
        </div>
    );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ShaderCanvas } from './components/ShaderCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { DpadControls } from './components/DpadControls';
import { Hud } from './components/Hud';
import { ShipOverlay } from './components/ShipOverlay';
import { AppProvider, useAppContext } from './context/AppContext';
import { useAppStoreComplete } from './hooks/useAppStore';
import { GearIcon, SpeakerWaveIcon, SpeakerXMarkIcon, RocketLaunchIcon } from './components/Icons';
import { SHOW_SETTINGS_BUTTON, SHOW_SHARE_BUTTON, SHOW_HUD_BUTTON, SHOW_MUTE_BUTTON } from './config';
import { Gateway } from './components/Gateway';
import { HUDOverlay } from './components/HUDOverlay';
import { SaveSystem } from './utils/SaveSystem';
import { HomeScreen, GarageScreen } from './components/Screens';
import { Rocket, Flame, PlaneLanding, PlaneTakeoff, Search, LogOut } from 'lucide-react';

// Optimization: Define static constant outside component to avoid recreation every render
const NAV_KEYS = ['w', 'a', 's', 'd', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

const AppContent: React.FC = () => {
    const {
        canvasSize,
        sliders,
        uniforms,
        currentSessionId,
        activeShaderCode,
        allUniforms,
        renderCameraRef,
        cameraControlsEnabled,
        setIsControlsOpen,
        isHdEnabled,
        setIsHdEnabled,
        isFpsEnabled,
        EDITMODE,
        isMoving,
        isInteracting,
        pressedKeys,
        viewMode,
        setViewMode,
        viewModeTransition,
        fileInputRef,
        handleFileChange,
        soundConfig,
        handleSoundConfigChange,
        pressKey, 
        releaseKey,
        handleUniformChange
    } = useAppContext();

    const [appPhase, setAppPhase] = useState<'HOME' | 'GARAGE' | 'GAME'>('HOME');
    const [isLanded, setIsLanded] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [activeLasers, setActiveLasers] = useState(0);
    const touchState = useRef({ active: false, startX: 0, startY: 0 });
    const [isLinkCopied, setIsLinkCopied] = useState(false);

    const handleShareClick = useCallback(() => {
        const params: Record<string, string | number> = {
            planet: currentSessionId,
            canvasSize,
        };

        sliders.forEach(slider => {
            const value = uniforms[slider.variableName];
            if (typeof value === 'number') {
                params[slider.variableName] = Number(value.toFixed(3));
            }
        });

        const hashString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
        
        const url = `${window.location.origin}${window.location.pathname}#${hashString}`;

        navigator.clipboard.writeText(url).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => {
                setIsLinkCopied(false);
            }, 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    }, [currentSessionId, canvasSize, sliders, uniforms]);

    const handleVolumeToggle = useCallback(() => {
        if (!soundConfig.enabled) {
            handleSoundConfigChange('enabled', true);
            handleSoundConfigChange('masterVolume', 0.5);
        } else {
            handleSoundConfigChange('enabled', false);
        }
    }, [soundConfig.enabled, handleSoundConfigChange]);

    const canvasContainerStyle: React.CSSProperties = {};
    if (canvasSize === '100%_square') {
        canvasContainerStyle.width = '100%';
        canvasContainerStyle.aspectRatio = '1 / 1';
        canvasContainerStyle.height = 'auto';
    } else if (canvasSize === '100%_height_square') {
        canvasContainerStyle.height = '100%';
        canvasContainerStyle.width = 'auto';
        canvasContainerStyle.aspectRatio = '1 / 1';
        canvasContainerStyle.margin = '0 auto';
    } else if (canvasSize === 'fit_screen_square') {
        canvasContainerStyle.width = 'min(100%, 100vh - 100px)';
        canvasContainerStyle.height = 'auto';
        canvasContainerStyle.aspectRatio = '1 / 1';
    } else if (canvasSize === '100%') {
        canvasContainerStyle.width = '100%';
        canvasContainerStyle.height = '100%';
    } else {
        canvasContainerStyle.width = canvasSize;
        canvasContainerStyle.height = canvasSize;
        canvasContainerStyle.aspectRatio = '1 / 1';
    }

    const handleShaderError = useCallback(() => {}, []);

    const isNavigating = NAV_KEYS.some(key => pressedKeys.has(key));
    const shouldReduceQuality = isMoving || isInteracting || isNavigating;

    const toggleViewMode = () => {
        setViewMode(viewMode === 'cockpit' ? 'chase' : 'cockpit');
    };

    const getVolumeIcon = () => {
        if (!soundConfig.enabled) return <SpeakerXMarkIcon className="w-6 h-6" />;
        return <SpeakerWaveIcon className="w-6 h-6" />;
    }

    const toggleLanding = useCallback(() => {
        const doc = SaveSystem.load();
        const newVal = doc.isLanded ? 0 : 1;
        SaveSystem.save({ ...doc, isLanded: newVal });
    }, []);

    const exitAircraft = useCallback(() => {
        // Toggle pilot mode
        const currentPilot = allUniforms['slider_pilot'] || 0;
        handleUniformChange('slider_pilot', currentPilot > 0.5 ? 0 : 1);
    }, [allUniforms, handleUniformChange]);

    useEffect(() => {
        if (appPhase !== 'GAME' && appPhase !== 'HOME') return;

        let interval = setInterval(() => {
            const l = SaveSystem.load().isLanded ? 1 : 0;
            setIsLanded(l === 1);
            
            const currentLanding = allUniforms['slider_landing'] || 0;
            if (l === 1 && currentLanding < 1) {
                handleUniformChange('slider_landing', Math.min(1, currentLanding + 0.05));
            } else if (l === 0 && currentLanding > 0) {
                handleUniformChange('slider_landing', Math.max(0, currentLanding - 0.05));
            }
        }, 50);
        return () => clearInterval(interval);
    }, [appPhase, allUniforms, handleUniformChange]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.controls-panel')) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        touchState.current = { active: true, startX: e.clientX, startY: e.clientY };
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
        if (!touchState.current.active) return;
        const dx = e.clientX - touchState.current.startX;
        const dy = e.clientY - touchState.current.startY;
        
        if (dx > 40) { pressKey('arrowright'); pressKey('d'); releaseKey('arrowleft'); releaseKey('a'); }
        else if (dx < -40) { pressKey('arrowleft'); pressKey('a'); releaseKey('arrowright'); releaseKey('d'); }
        else { releaseKey('arrowright'); releaseKey('arrowleft'); releaseKey('a'); releaseKey('d'); }

        if (dy > 40) { pressKey('arrowdown'); releaseKey('arrowup'); }
        else if (dy < -40) { pressKey('arrowup'); releaseKey('arrowdown'); }
        else { releaseKey('arrowup'); releaseKey('arrowdown'); }
    }, [pressKey, releaseKey]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
        touchState.current.active = false;
        releaseKey('arrowleft'); releaseKey('arrowright'); 
        releaseKey('a'); releaseKey('d');
        releaseKey('arrowup'); releaseKey('arrowdown');
    }, [releaseKey]);

    useEffect(() => {
        if (appPhase !== 'GAME') return;
        const checkLasers = () => {
            if (pressedKeys.has(' ')) {
                setActiveLasers(prev => Math.min(prev + 2, 24));
                const current = SaveSystem.load();
                SaveSystem.save({ totalFires: current.totalFires + 2 });
            } else {
                setActiveLasers(prev => Math.max(0, prev - 1));
            }
            
            const cur = SaveSystem.load();
            SaveSystem.save({ runtime: cur.runtime + 1 });
        };
        const id = setInterval(checkLasers, 100);
        return () => clearInterval(id);
    }, [pressedKeys, appPhase]);

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden relative">
            {appPhase === 'HOME' && <HomeScreen onStart={() => setAppPhase('GAME')} onGarage={() => setAppPhase('GARAGE')} />}
            {appPhase === 'GARAGE' && <GarageScreen onBack={() => setAppPhase('HOME')} />}
            
            {appPhase === 'GAME' && <HUDOverlay activeLasers={activeLasers} />}
            
            <main 
                className={`flex-grow bg-black flex items-center justify-center overflow-hidden touch-none transition-transform duration-500 will-change-transform ${isZoomed ? 'scale-150' : 'scale-100'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handlePointerUp}
            >
                <div
                    className="relative"
                    style={{ ...canvasContainerStyle, maxWidth: '100%', maxHeight: '100%' }}
                >
                    {activeShaderCode && (appPhase === 'GAME' || appPhase === 'HOME') && (
                        <ShaderCanvas
                            key={activeShaderCode}
                            fragmentSrc={activeShaderCode}
                            onError={handleShaderError}
                            uniforms={allUniforms}
                            cameraRef={renderCameraRef}
                            isHdEnabled={isHdEnabled}
                            isFpsEnabled={isFpsEnabled}
                            isPlaying={true}
                            shouldReduceQuality={shouldReduceQuality}
                        />
                    )}
                    {(appPhase === 'GAME' || appPhase === 'HOME') && <ShipOverlay />}
                    {(appPhase === 'GAME' || appPhase === 'HOME') && (
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+4rem)] pointer-events-none opacity-50 mix-blend-screen transition-all duration-500 ${isZoomed ? 'scale-75' : ''}`}>
                            <span className="text-[#00F3FF] tracking-[2em] font-mono font-bold text-2xl uppercase" style={{ textShadow: '0 0 15px #00F3FF' }}>SGRD</span>
                        </div>
                    )}
                </div>
            </main>
            
            {appPhase === 'GAME' && (
                <>
                <Hud />
                <ControlsPanel />
                {cameraControlsEnabled && <DpadControls />}
                
                {/* STRICT 3x3 UI GRID OVERLAY */}
                <div className="fixed inset-0 z-50 pointer-events-none p-5 grid grid-cols-3 grid-rows-3 gap-4">
                    {/* TOP LEFT: Utilities */}
                    <div className="flex flex-col gap-3 items-start justify-start pointer-events-auto">
                        <button
                            onClick={() => setIsHdEnabled(!isHdEnabled)}
                            className={`w-12 h-12 flex items-center justify-center transition-all bg-black/70 backdrop-blur-md rounded-none border-2
                                        ${isHdEnabled ? 'text-[#00FF66] border-[#00FF66]' : 'text-gray-400 border-gray-600 hover:border-gray-400'}`}
                        >
                            <span className="font-bold text-sm">HD</span>
                        </button>
                        
                         {cameraControlsEnabled && SHOW_HUD_BUTTON && (
                            <button
                                onClick={toggleViewMode}
                                className={`w-12 h-12 flex items-center justify-center transition-all bg-black/70 backdrop-blur-md rounded-none border-2
                                            ${viewMode === 'chase' ? 'text-[#00F3FF] border-[#00F3FF]' : 'text-gray-400 border-gray-600 hover:border-gray-400'}`}
                            >
                               <RocketLaunchIcon className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    {/* TOP CENTER: Zoom Toggle */}
                    <div className="flex items-start justify-center pointer-events-auto">
                        <button 
                            onClick={() => setIsZoomed(!isZoomed)}
                            className={`w-14 h-14 flex items-center justify-center transition-all duration-300 bg-black/70 backdrop-blur-md rounded-none border-2 ${isZoomed ? 'border-[#00F3FF] text-[#00F3FF] scale-110 shadow-[0_0_15px_rgba(0,243,255,0.5)]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}>
                            <Search className="w-6 h-6" />
                        </button>
                    </div>

                    {/* TOP RIGHT: Settings & Volume */}
                    <div className="flex flex-col gap-3 items-end justify-start pointer-events-auto">
                        {SHOW_SETTINGS_BUTTON && (
                            <button
                                onClick={() => setIsControlsOpen(true)}
                                className="w-12 h-12 flex items-center justify-center transition-all bg-black/70 backdrop-blur-md rounded-none border-2 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                            >
                                <GearIcon className="w-6 h-6" />
                            </button>
                        )}

                        {SHOW_MUTE_BUTTON && (
                            <button
                                onClick={handleVolumeToggle}
                                className={`w-12 h-12 flex items-center justify-center transition-all bg-black/70 backdrop-blur-md rounded-none border-2
                                            ${soundConfig.enabled ? 'text-[#00F3FF] border-[#00F3FF]' : 'text-gray-400 border-gray-600'}`}
                            >
                                {getVolumeIcon()}
                            </button>
                        )}
                    </div>

                    {/* MIDDLE LEFT: Data (if HUDOverlay component is removed, otherwise it handles it) */}
                    <div className="flex items-center justify-start pointer-events-none"></div>

                    {/* MIDDLE CENTER: Crosshair / Compass (managed by HUDOverlay) */}
                    <div className="flex items-center justify-center pointer-events-none"></div>

                    {/* MIDDLE RIGHT: Additional HUD Data */}
                    <div className="flex items-center justify-end pointer-events-none"></div>

                    {/* BOTTOM LEFT: State Management (Aircraft) */}
                    <div className="flex flex-col items-start justify-end pointer-events-auto">
                        {isLanded && (
                            <button 
                                onClick={exitAircraft}
                                className="px-6 py-3 bg-black/70 rounded-none text-[#00F3FF] font-bold font-mono backdrop-blur-md border-2 border-[#00F3FF] shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)] flex items-center gap-2 transform active:scale-95 transition-all uppercase tracking-wider">
                                <LogOut className="w-5 h-5" />
                                {allUniforms['slider_pilot'] > 0.5 ? 'Enter Aircraft' : 'Exit Aircraft'}
                            </button>
                        )}
                    </div>

                    {/* BOTTOM CENTER: Empty to preserve view */}
                    <div className="flex items-end justify-center pointer-events-none"></div>

                    {/* BOTTOM RIGHT: Actions */}
                    <div className="flex gap-4 items-end justify-end pointer-events-auto">
                        <button 
                            onPointerDown={() => pressKey('m')} 
                            onPointerUp={() => releaseKey('m')} 
                            className="w-16 h-16 flex items-center justify-center bg-black/70 rounded-none text-[#00F3FF] backdrop-blur-md border-2 border-[#00F3FF] hover:border-[#00FF66] hover:text-[#00FF66] transform active:scale-95 transition-all uppercase shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                            <Rocket className="w-8 h-8" />
                        </button>
                        <button 
                            onPointerDown={() => pressKey(' ')} 
                            onPointerUp={() => releaseKey(' ')} 
                            className="w-16 h-16 flex items-center justify-center bg-black/70 rounded-none text-[#00FF66] backdrop-blur-md hover:border-[#00F3FF] hover:text-[#00F3FF] border-2 border-[#00FF66] transform active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                            <Flame className="w-8 h-8" />
                        </button>
                        <button 
                            onClick={toggleLanding} 
                            className={`w-16 h-16 flex items-center justify-center bg-black/70 rounded-none backdrop-blur-md border-2 transform active:scale-95 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isLanded ? 'text-orange-400 border-orange-400' : 'text-gray-400 border-gray-600'}`}>
                            {isLanded ? <PlaneTakeoff className="w-8 h-8" /> : <PlaneLanding className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const store = useAppStoreComplete();
    return (
        <AppProvider value={store}>
            <AppContent />
        </AppProvider>
    );
};

export default App;

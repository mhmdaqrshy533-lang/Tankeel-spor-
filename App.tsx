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
        renderCameraRef, // Use renderCameraRef for offset support
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
    } = useAppContext();

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

    // Binary Volume Toggle
    const handleVolumeToggle = useCallback(() => {
        if (!soundConfig.enabled) {
             // Off -> On
            handleSoundConfigChange('enabled', true);
            handleSoundConfigChange('masterVolume', 0.5);
        } else {
            // On -> Off (Instant)
            handleSoundConfigChange('enabled', false);
        }
    }, [soundConfig.enabled, handleSoundConfigChange]);

    const canvasContainerStyle: React.CSSProperties = {};

    if (canvasSize === '100%_square') {
        canvasContainerStyle.width = '100%';
        canvasContainerStyle.aspectRatio = '1 / 1';
        // Force height auto so aspect ratio controls the height
        canvasContainerStyle.height = 'auto';
    } else if (canvasSize === '100%_height_square') {
        canvasContainerStyle.height = '100%';
        canvasContainerStyle.width = 'auto';
        canvasContainerStyle.aspectRatio = '1 / 1';
        // Center horizontally
        canvasContainerStyle.margin = '0 auto';
    } else if (canvasSize === 'fit_screen_square') {
        // Best fit: Use the smaller of width (100%) or available height (100vh - header buffer)
        // This ensures the square fits in the viewport regardless of orientation
        canvasContainerStyle.width = 'min(100%, 100vh - 100px)';
        canvasContainerStyle.height = 'auto';
        canvasContainerStyle.aspectRatio = '1 / 1';
    } else if (canvasSize === '100%') {
        canvasContainerStyle.width = '100%';
        canvasContainerStyle.height = '100%';
    } else { // '1024px', '512px', etc.
        canvasContainerStyle.width = canvasSize;
        canvasContainerStyle.height = canvasSize;
        canvasContainerStyle.aspectRatio = '1 / 1';
    }

    const handleShaderError = useCallback(() => {
        // This function is passed to the ShaderCanvas component.
        // It's wrapped in useCallback to ensure its reference stability.
    }, []);

    // Determine if we should drop quality for performance.
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
        // Update slider landing in context (we'll just use context update if we can)
    }, []);

    const { handleUniformChange } = useAppContext();
    const [isLanded, setIsLanded] = useState(false);

    useEffect(() => {
        let interval = setInterval(() => {
            const l = SaveSystem.load().isLanded ? 1 : 0;
            setIsLanded(l === 1);
            
            // smooth transition for slider_landing
            const currentLanding = allUniforms['slider_landing'] || 0;
            if (l === 1 && currentLanding < 1) {
                handleUniformChange('slider_landing', Math.min(1, currentLanding + 0.05));
            } else if (l === 0 && currentLanding > 0) {
                handleUniformChange('slider_landing', Math.max(0, currentLanding - 0.05));
            }
        }, 50);
        return () => clearInterval(interval);
    }, [allUniforms, handleUniformChange]);

    // Pointer drag for Hajwalah physics
    const { pressKey, releaseKey } = useAppContext();
    const touchState = useRef({ active: false, startX: 0, startY: 0 });
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.controls-panel')) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        touchState.current = { active: true, startX: e.clientX, startY: e.clientY };
        
        // Mobile tap to fire
        pressKey(' ');
    }, [pressKey]);
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
        if (!touchState.current.active) return;
        const dx = e.clientX - touchState.current.startX;
        const dy = e.clientY - touchState.current.startY;
        
        // Horizontal Drag -> Yaw (arrow keys) and Strafe
        if (dx > 40) { pressKey('arrowright'); pressKey('d'); releaseKey('arrowleft'); releaseKey('a'); }
        else if (dx < -40) { pressKey('arrowleft'); pressKey('a'); releaseKey('arrowright'); releaseKey('d'); }
        else { releaseKey('arrowright'); releaseKey('arrowleft'); releaseKey('a'); releaseKey('d'); }

        // Vertical Drag -> Pitch (arrow keys)
        if (dy > 40) { pressKey('arrowdown'); releaseKey('arrowup'); }
        else if (dy < -40) { pressKey('arrowup'); releaseKey('arrowdown'); }
        else { releaseKey('arrowup'); releaseKey('arrowdown'); }
    }, [pressKey, releaseKey]);
    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
        touchState.current.active = false;
        releaseKey('arrowleft'); releaseKey('arrowright'); 
        releaseKey('a'); releaseKey('d');
        releaseKey('arrowup'); releaseKey('arrowdown');
        releaseKey(' '); // Release mobile fire
    }, [releaseKey]);

    const [activeLasers, setActiveLasers] = useState(0);

    useEffect(() => {
        const checkLasers = () => {
            if (pressedKeys.has(' ')) {
                setActiveLasers(prev => Math.min(prev + 2, 24)); // Simulated dual lasers
                const current = SaveSystem.load();
                SaveSystem.save({ totalFires: current.totalFires + 2 });
            } else {
                setActiveLasers(prev => Math.max(0, prev - 1)); // Decay
            }
            
            // Advance runtime
            const cur = SaveSystem.load();
            SaveSystem.save({ runtime: cur.runtime + 1 });
        };
        const id = setInterval(checkLasers, 100);
        return () => clearInterval(id);
    }, [pressedKeys]);

    return (
        <Gateway>
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden relative">
             {/* Hidden input for file importing */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json"
            />

            <HUDOverlay activeLasers={activeLasers} />

            
            <main 
                className={`flex-grow bg-black flex items-center justify-center overflow-hidden touch-none`}
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
                    {activeShaderCode && (
                        <ShaderCanvas
                            key={activeShaderCode}
                            fragmentSrc={activeShaderCode}
                            onError={handleShaderError}
                            uniforms={allUniforms}
                            cameraRef={renderCameraRef} // Use the render-specific camera ref
                            isHdEnabled={isHdEnabled}
                            isFpsEnabled={isFpsEnabled}
                            isPlaying={true}
                            shouldReduceQuality={shouldReduceQuality}
                        />
                    )}
                    <ShipOverlay />
                </div>
            </main>
            
            <Hud />
            
            <ControlsPanel />
            {cameraControlsEnabled && <DpadControls />}
            
            {/* Top Left Buttons Group: HD & Ship */}
            <div className="fixed top-4 left-4 z-30 flex flex-col gap-2">
                <button
                    onClick={() => setIsHdEnabled(!isHdEnabled)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all transform hover:scale-110 shadow-lg border backdrop-blur-sm
                                ${isHdEnabled ? 'bg-white/90 text-black border-gray-300' : 'bg-gray-500/30 text-white border-white/20'}`}
                    aria-label={`Toggle HD Mode (${isHdEnabled ? 'On' : 'Off'})`}
                    title={`HD Mode (${isHdEnabled ? 'On' : 'Off'})`}
                >
                    <span className="font-bold text-sm">HD</span>
                </button>
                
                 {cameraControlsEnabled && SHOW_HUD_BUTTON && (
                    <button
                        onClick={toggleViewMode}
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all transform hover:scale-110 shadow-lg border backdrop-blur-sm
                                    ${viewMode === 'chase' ? 'bg-white/90 text-black border-gray-300' : 'bg-gray-500/30 text-white border-white/20'}`}
                        aria-label={`Toggle View Mode (Current: ${viewMode})`}
                        title={viewMode === 'chase' ? "Switch to Cockpit View" : "Switch to Chase View"}
                    >
                       <RocketLaunchIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Top Right Buttons Group: Settings & Sound */}
            <div className="fixed top-4 right-4 z-30 flex flex-col gap-2">
                {SHOW_SETTINGS_BUTTON && (
                    <button
                        onClick={() => setIsControlsOpen(true)}
                        className="w-12 h-12 flex items-center justify-center bg-gray-500/30 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all transform hover:scale-110 shadow-lg"
                        aria-label="Open Controls"
                        title="Open Controls Panel"
                    >
                        <GearIcon className="w-6 h-6" />
                    </button>
                )}

                {SHOW_MUTE_BUTTON && (
                    <button
                        onClick={handleVolumeToggle}
                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all transform hover:scale-110 shadow-lg border backdrop-blur-sm
                                    ${soundConfig.enabled ? 'bg-white/90 text-black border-gray-300' : 'bg-gray-500/30 text-white border-white/20'}`}
                        aria-label={`Toggle Sound`}
                        title={`Sound: ${!soundConfig.enabled ? 'Off' : 'On'}`}
                    >
                        {getVolumeIcon()}
                    </button>
                )}

                {EDITMODE && SHOW_SHARE_BUTTON && (
                    <div className="relative">
                        <button
                            onClick={handleShareClick}
                            className="w-12 h-12 flex items-center justify-center rounded-full text-white transition-all transform hover:scale-110 shadow-lg bg-gray-500/30 backdrop-blur-sm border border-white/20"
                            aria-label="Copy shareable link"
                            title="Copy Shareable Link"
                        >
                            <span className="material-symbols-outlined">share</span>
                        </button>
                        {isLinkCopied && (
                            <div 
                                className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-semibold rounded-full shadow-lg whitespace-nowrap border border-gray-300"
                                aria-live="polite"
                            >
                                Link Copied!
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
                <button 
                    onPointerDown={() => pressKey(' ')} 
                    onPointerUp={() => releaseKey(' ')} 
                    className="px-4 py-2 bg-red-600/80 rounded-lg text-white font-bold backdrop-blur select-none touch-none border border-red-400 shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                    زر قذف نار
                </button>
                <button 
                    onPointerDown={() => pressKey('m')} 
                    onPointerUp={() => releaseKey('m')} 
                    className="px-4 py-2 bg-blue-600/80 rounded-lg text-white font-bold backdrop-blur select-none touch-none border border-blue-400 shadow-[0_0_15px_rgba(0,0,255,0.5)]">
                    زر قذف صاروخ
                </button>
                <button 
                    onClick={toggleLanding} 
                    className={`px-4 py-2 rounded-lg text-white font-bold backdrop-blur select-none touch-none border shadow-lg ${isLanded ? 'bg-orange-600/80 border-orange-400' : 'bg-green-600/80 border-green-400 shadow-[0_0_15px_rgba(0,255,0,0.5)]'}`}>
                    {isLanded ? 'الاقلاع' : 'زر الهبوط وقتال الفضائيين'}
                </button>
            </div>
        </div>
        </Gateway>
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

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "motion/react"
import { useMountEffect } from "@/hooks/use-mount-effect"
import { cn } from "@/lib/utils"
import { useAppChrome } from "@/components/app-chrome"
import { TypingTest } from "@/components/typing-test"
import { useSettings, SOUND_PACKS } from "@/components/settings-context"
import { Loading } from "@/components/ui/loader"
import { IconKeyboardShow, IconKeyboardHide } from "@tabler/icons-react"

const Keyboard = dynamic(() => import("@/components/ui/keyboard").then((module) => module.Keyboard), { ssr: false })
const MagicKeyboard = dynamic(() => import("@/components/ui/magic-keyboard").then((module) => module.Keyboard), { ssr: false })
const RGBKeyboard = dynamic(() => import("@/components/ui/rgb-keyboard").then((module) => module.RGBKeyboard), { ssr: false })
const MechanicalKeyboard = dynamic(() => import("@/components/ui/mechanical-keyboard").then((module) => module.MechanicalKeyboard), { ssr: false })
const MinimalKeyboard = dynamic(() => import("@/components/ui/minimal-keyboard").then((module) => module.MinimalKeyboard), { ssr: false })

export default function Page() {
    const { settingsOpen, testSettingsOpen, setTypingActive, homeLogoHandlerRef } = useAppChrome()
    const [isFinished, setIsFinished] = useState(false)
    const [typingFocused, setTypingFocused] = useState(true)
    const [restartKey, setRestartKey] = useState(0)
    const [mode, setMode] = useState<string>("time")
    const { showKeyboard, setShowKeyboard, keyboardStyle, soundEnabled, soundPack, language, setSoundPackLoading, settingsLoaded } = useSettings()
    const soundPackOption = SOUND_PACKS.find((s) => s.id === soundPack)
    const soundUrl = soundPackOption?.url ?? "/sounds/sound.ogg"
    const soundConfigUrl = soundPackOption?.configUrl

    useMountEffect(() => {
        homeLogoHandlerRef.current = () => {
            setIsFinished(false)
            setRestartKey((k) => k + 1)
        }
        return () => {
            homeLogoHandlerRef.current = null
        }
    })

    const typingActiveRef = useRef(false)
    const handleTypingActiveChange = useCallback(
        (active: boolean) => {
            if (typingActiveRef.current === active) return
            typingActiveRef.current = active
            setTypingActive(active)
        },
        [setTypingActive],
    )

    const finishedRef = useRef(isFinished)
 
    useEffect(() => {
        finishedRef.current = isFinished
    }, [isFinished])

    const handleFinished = useCallback((finished: boolean) => {
        if (finishedRef.current === finished) return
        finishedRef.current = finished
        setIsFinished(finished)
    }, [])

    const focusedRef = useRef(typingFocused)
    const handleFocusChange = useCallback((focused: boolean) => {
        if (focusedRef.current === focused) return
        focusedRef.current = focused
        setTypingFocused(focused)
    }, [])

    const modeRef = useRef(mode)
    const handleModeChange = useCallback((m: string) => {
        if (modeRef.current === m) return
        modeRef.current = m
        setMode(m)
    }, [])

    const showFooter = !isFinished && showKeyboard

    return (
        <>
            {/* Full-screen settings-hydration loader */}
            <AnimatePresence>
                {!settingsLoaded && (
                    <motion.div
                        key="settings-loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col items-center gap-5"
                        >

                            <Loading className="h-6 w-6" />
                            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase select-none">
                                Loading Your Settings <span className="animate-pulse">...</span>
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Hardware-accelerated ambient radial glow reflecting theme accent */}
                <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
                    <div className="h-[550px] w-[900px] rounded-full bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent blur-3xl opacity-75 transition-opacity duration-1000" />
                </div>
                <main
                    className={cn(
                        "flex flex-col px-6 relative z-10",
                        isFinished
                            ? "flex-1 justify-center px-10 py-2"
                            : showFooter
                                ? "flex-1 items-center justify-center lg:justify-end lg:pb-8"
                                : "flex-1 items-center",
                    )}
                >
                    <TypingTest
                        key={restartKey}
                        onFinished={handleFinished}
                        onTypingActiveChange={handleTypingActiveChange}
                        onFocusChange={handleFocusChange}
                        onModeChange={handleModeChange}
                        pauseTypingInputRefocus={settingsOpen || testSettingsOpen}
                    />
                </main>

                {!isFinished && (
                    <footer
                        className="hidden items-end justify-center md:flex shrink-0 relative transition-all duration-300"
                        style={{ height: showKeyboard ? "auto" : 0, overflow: "visible" }}
                    >
                        <div
                            className={cn(
                                "origin-bottom scale-[0.68] lg:scale-[0.8] xl:scale-[0.85] w-full flex justify-center transition-all duration-300",
                                !showKeyboard && "opacity-0 pointer-events-none scale-y-0"
                            )}
                        >
                            {keyboardStyle === "magic" && (
                                <MagicKeyboard
                                    enableHaptics
                                    enableSound={soundEnabled}
                                    soundUrl={soundUrl}
                                    soundConfigUrl={soundConfigUrl}
                                    forceActive={soundEnabled && !showKeyboard}
                                    physicalKeysEnabled={typingFocused}
                                    language={language}
                                    onAudioLoadingChange={setSoundPackLoading}
                                />
                            )}
                            {keyboardStyle === "rgb" && (
                                <RGBKeyboard
                                    enableHaptics
                                    enableSound={soundEnabled}
                                    soundUrl={soundUrl}
                                    soundConfigUrl={soundConfigUrl}
                                    forceActive={soundEnabled && !showKeyboard}
                                    physicalKeysEnabled={typingFocused}
                                    language={language}
                                    onAudioLoadingChange={setSoundPackLoading}
                                />
                            )}
                            {keyboardStyle === "mechanical" && (
                                <MechanicalKeyboard
                                    enableHaptics
                                    enableSound={soundEnabled}
                                    soundUrl={soundUrl}
                                    soundConfigUrl={soundConfigUrl}
                                    forceActive={soundEnabled && !showKeyboard}
                                    physicalKeysEnabled={typingFocused}
                                    language={language}
                                    onAudioLoadingChange={setSoundPackLoading}
                                />
                            )}
                            {keyboardStyle === "minimal" && (
                                <MinimalKeyboard
                                    enableHaptics
                                    enableSound={soundEnabled}
                                    soundUrl={soundUrl}
                                    soundConfigUrl={soundConfigUrl}
                                    forceActive={soundEnabled && !showKeyboard}
                                    physicalKeysEnabled={typingFocused}
                                    language={language}
                                    onAudioLoadingChange={setSoundPackLoading}
                                />
                            )}
                            {["normal", "split", "ortho", "compact"].includes(keyboardStyle) && (
                                <Keyboard
                                    theme="classic"
                                    enableHaptics
                                    enableSound={soundEnabled}
                                    soundUrl={soundUrl}
                                    soundConfigUrl={soundConfigUrl}
                                    forceActive={soundEnabled && !showKeyboard}
                                    physicalKeysEnabled={typingFocused}
                                    language={language}
                                    onAudioLoadingChange={setSoundPackLoading}
                                />
                            )}
                        </div>

                        {/* Keyboard Toggle Button */}
                        <div className="fixed right-6 bottom-6 lg:right-10 z-50 flex items-center justify-center">
                            <button
                                onClick={() => setShowKeyboard(!showKeyboard)}
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted bg-background/50 backdrop-blur-sm border border-transparent hover:border-border"
                                title={showKeyboard ? "Hide keyboard" : "Show keyboard"}
                            >
                                {showKeyboard ? <IconKeyboardHide size={20} /> : <IconKeyboardShow size={20} />}
                            </button>
                        </div>
                    </footer>
                )}
            </div>
        </>
    )
}

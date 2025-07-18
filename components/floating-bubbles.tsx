"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

function Bubble({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.7, 0.3, 0.7],
        scale: [1, 1.2, 1],
        x: x + Math.random() * 100 - 50,
        y: y + Math.random() * 100 - 50,
      }}
      transition={{
        duration: 5 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    />
  )
}

function FloatingBubbles() {
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string }>>([])

  useEffect(() => {
    const newBubbles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 20 + 5,
      color: `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`,
    }))
    setBubbles(newBubbles)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <title>Floating Bubbles</title>
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} {...bubble} />
        ))}
      </svg>
    </div>
  )
}

export default function FloatingBubblesBackground({
  title = "Floating Bubbles",
}: {
  title?: string
}) {
  const words = title.split(" ")

  // State for user prompt & AI response
  const [prompt, setPrompt] = useState("")
  const [montageJSON, setMontageJSON] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setMontageJSON(null)
    try {
      const res = await fetch("/api/generate-montage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: prompt }),
      })

      if (!res.ok) throw new Error(await res.text())

      const data = (await res.json()) as { content: string }
      setMontageJSON(data.content)
    } catch (err) {
      console.error(err)
      setMontageJSON("Error generating montage. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
      <FloatingBubbles />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text 
                               bg-gradient-to-r from-blue-600 to-purple-600 
                               dark:from-blue-300 dark:to-purple-300"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {/* User prompt input */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <textarea
              className="w-full max-w-xl p-4 rounded-lg border border-blue-300/50 dark:border-blue-700/50 bg-white/70 dark:bg-black/60 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md"
              placeholder="Describe the montage you want..."
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 font-medium"
            >
              {loading ? "Generating..." : "Generate Montage"}
            </Button>
          </div>

          {/* Generated JSON output */}
          {montageJSON && (
            <pre className="text-left whitespace-pre-wrap bg-black/20 dark:bg-white/10 rounded-lg p-4 overflow-auto max-h-80 text-sm">
              {montageJSON}
            </pre>
          )}

          <div
            className="inline-block group relative bg-gradient-to-b from-blue-400/30 to-purple-400/30 
                       dark:from-blue-600/30 dark:to-purple-600/30 p-px rounded-2xl backdrop-blur-lg 
                       overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Button
              variant="ghost"
              className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                         bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90 
                         text-blue-600 dark:text-blue-300 transition-all duration-300 
                         group-hover:-translate-y-0.5 border border-blue-200/50 dark:border-blue-700/50
                         hover:shadow-md dark:hover:shadow-blue-900/30"
            >
              <span className="opacity-90 group-hover:opacity-100 transition-opacity">Explore the Bubbles</span>
              <span
                className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                           transition-all duration-300"
              >
                →
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

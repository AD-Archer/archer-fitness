import { useState, useEffect } from "react"
import type { WorkoutSession } from "../types/workout"

export interface WorkoutTimerState {
  timer: number
  exerciseTimer: number
  isTimerRunning: boolean
  isResting: boolean
  restTimer: number
  currentExerciseIndex: number
}

export function useWorkoutTimer(session: WorkoutSession | null, initialState?: Partial<WorkoutTimerState>) {
  const [timer, setTimer] = useState(initialState?.timer || 0)
  const [exerciseTimer, setExerciseTimer] = useState(initialState?.exerciseTimer || 0)
  const [isTimerRunning, setIsTimerRunning] = useState(initialState?.isTimerRunning || false)
  const [restTimer, setRestTimer] = useState(initialState?.restTimer || 0)
  const [isResting, setIsResting] = useState(initialState?.isResting || false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(initialState?.currentExerciseIndex || 0)

  // Auto-start timer when a session starts (if not already restored from saved state)
  useEffect(() => {
    if (session && session.isActive && !initialState) {
      setIsTimerRunning(true)
    }
  }, [session, initialState])

  // Main workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && session) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, session])

  // Exercise timer effect - runs for timed exercises
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && session && !isResting) {
      const currentExercise = session.exercises[currentExerciseIndex]
      if (currentExercise?.targetType === "time") {
        interval = setInterval(() => {
          setExerciseTimer((prev) => prev + 1)
        }, 1000)
      }
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, session, currentExerciseIndex, isResting])

  // Rest timer effect - counts down rest time
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0 && isTimerRunning) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer, isTimerRunning])

  // Reset exercise timer when switching exercises
  useEffect(() => {
    setExerciseTimer(0)
  }, [currentExerciseIndex])

  const pauseWorkout = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const startRest = (duration: number = 90) => {
    setRestTimer(duration)
    setIsResting(true)
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTimer(0)
  }

  const nextExercise = () => {
    if (currentExerciseIndex < (session?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
    }
  }

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
    }
  }

  const switchToExercise = (index: number) => {
    setCurrentExerciseIndex(index)
  }

  const reset = () => {
    setTimer(0)
    setIsTimerRunning(false)
    setCurrentExerciseIndex(0)
    setExerciseTimer(0)
    setIsResting(false)
    setRestTimer(0)
  }

  return {
    timer,
    exerciseTimer,
    isTimerRunning,
    restTimer,
    isResting,
    currentExerciseIndex,
    pauseWorkout,
    startRest,
    skipRest,
    nextExercise,
    previousExercise,
    switchToExercise,
    reset,
    setTimer,
    setIsTimerRunning,
  }
}

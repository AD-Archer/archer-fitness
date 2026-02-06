import { useState, useEffect, useRef } from "react";
import type { WorkoutSession } from "../types/workout";

export interface WorkoutTimerState {
  timer: number;
  exerciseTimer: number;
  isTimerRunning: boolean;
  isResting: boolean;
  restTimer: number;
  currentExerciseIndex: number;
}

export function useWorkoutTimer(
  session: WorkoutSession | null,
  initialState?: Partial<WorkoutTimerState>,
) {
  const [timer, setTimer] = useState(initialState?.timer || 0);
  const [exerciseTimer, setExerciseTimer] = useState(
    initialState?.exerciseTimer || 0,
  );
  const [isTimerRunning, setIsTimerRunning] = useState(
    initialState?.isTimerRunning || false,
  );
  const [restTimer, setRestTimer] = useState(initialState?.restTimer || 0);
  const [isResting, setIsResting] = useState(initialState?.isResting || false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(() => {
    const initial = initialState?.currentExerciseIndex || 0;
    const maxIndex = session?.exercises.length
      ? Math.max(0, session.exercises.length - 1)
      : 0;
    return Math.min(initial, maxIndex);
  });

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Adjust currentExerciseIndex if it's out of bounds when session changes
  useEffect(() => {
    if (session && currentExerciseIndex >= session.exercises.length) {
      setCurrentExerciseIndex(Math.max(0, session.exercises.length - 1));
    }
  }, [session, currentExerciseIndex]);

  // Auto-start timer when a session starts (if not already restored from saved state)
  useEffect(() => {
    if (session && session.isActive && !initialState) {
      setIsTimerRunning(true);
    }
  }, [session, initialState]);

  // Main workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && session) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, session]);

  // Exercise timer effect - runs for timed exercises
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && session && !isResting) {
      const currentExercise = session.exercises[currentExerciseIndex];
      if (currentExercise?.targetType === "time") {
        interval = setInterval(() => {
          setExerciseTimer((prev) => prev + 1);
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, session, currentExerciseIndex, isResting]);

  // Rest timer effect - counts down rest time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0 && isTimerRunning) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer, isTimerRunning]);

  // Reset exercise timer when switching exercises
  useEffect(() => {
    setExerciseTimer(0);
  }, [currentExerciseIndex]);

  const pauseWorkout = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const startRest = (duration: number = 90) => {
    setRestTimer(duration);
    setIsResting(true);
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const addRestTime = (seconds: number) => {
    setRestTimer((prev) => prev + seconds);
  };

  const removeRestTime = (seconds: number) => {
    setRestTimer((prev) => Math.max(0, prev - seconds));
  };

  const nextExercise = () => {
    if (
      currentExerciseIndex <
      (sessionRef.current?.exercises.length || 0) - 1
    ) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
  };

  const switchToExercise = (index: number) => {
    const maxIndex = (sessionRef.current?.exercises.length || 0) - 1;
    const clampedIndex = Math.min(Math.max(0, index), maxIndex);
    setCurrentExerciseIndex(clampedIndex);
  };

  const reset = () => {
    setTimer(0);
    setIsTimerRunning(false);
    setCurrentExerciseIndex(0);
    setExerciseTimer(0);
    setIsResting(false);
    setRestTimer(0);
  };

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
    addRestTime,
    removeRestTime,
    nextExercise,
    previousExercise,
    switchToExercise,
    reset,
    setTimer,
    setIsTimerRunning,
  };
}

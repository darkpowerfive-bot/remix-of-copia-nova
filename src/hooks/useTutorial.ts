import { useState, useEffect, useCallback } from "react";

const TUTORIALS_STORAGE_KEY = "completed_tutorials";

export function useTutorial(tutorialId: string) {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true); // Default to true to avoid flash
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const completedTutorials = JSON.parse(
      localStorage.getItem(TUTORIALS_STORAGE_KEY) || "[]"
    ) as string[];
    
    const seen = completedTutorials.includes(tutorialId);
    setHasSeenTutorial(seen);
    
    // Auto-show tutorial if not seen (with small delay for page to render)
    if (!seen) {
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, [tutorialId]);

  const completeTutorial = useCallback(() => {
    const completedTutorials = JSON.parse(
      localStorage.getItem(TUTORIALS_STORAGE_KEY) || "[]"
    ) as string[];
    
    if (!completedTutorials.includes(tutorialId)) {
      completedTutorials.push(tutorialId);
      localStorage.setItem(TUTORIALS_STORAGE_KEY, JSON.stringify(completedTutorials));
    }
    
    setHasSeenTutorial(true);
    setShowTutorial(false);
  }, [tutorialId]);

  const resetTutorial = useCallback(() => {
    const completedTutorials = JSON.parse(
      localStorage.getItem(TUTORIALS_STORAGE_KEY) || "[]"
    ) as string[];
    
    const filtered = completedTutorials.filter((id: string) => id !== tutorialId);
    localStorage.setItem(TUTORIALS_STORAGE_KEY, JSON.stringify(filtered));
    
    setHasSeenTutorial(false);
    setShowTutorial(true);
  }, [tutorialId]);

  const openTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return {
    hasSeenTutorial,
    showTutorial,
    completeTutorial,
    resetTutorial,
    openTutorial,
    closeTutorial,
  };
}

// Reset all tutorials (for testing)
export function resetAllTutorials() {
  localStorage.removeItem(TUTORIALS_STORAGE_KEY);
}

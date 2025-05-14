import React, { createContext, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';
import MoodMatcher from '@/components/MoodMatcher';

type MoodMatcherContextType = {
  isVisible: boolean;
  openMoodMatcher: () => void;
  closeMoodMatcher: () => void;
};

const MoodMatcherContext = createContext<MoodMatcherContextType>({
  isVisible: false,
  openMoodMatcher: () => {},
  closeMoodMatcher: () => {},
});

/**
 * MoodMatcherProvider component that provides mood matcher modal functionality
 * Controls the visibility state of the mood matcher modal
 */
export function MoodMatcherProvider({ children }: PropsWithChildren) {
  const [isVisible, setIsVisible] = useState(false);

  const openMoodMatcher = () => {
    setIsVisible(true);
  };

  const closeMoodMatcher = () => {
    setIsVisible(false);
  };

  return (
    <MoodMatcherContext.Provider
      value={{
        isVisible,
        openMoodMatcher,
        closeMoodMatcher,
      }}
    >
      {children}
      <MoodMatcher isVisible={isVisible} onClose={closeMoodMatcher} />
    </MoodMatcherContext.Provider>
  );
}

/**
 * Custom hook to access the mood matcher context
 * @returns The mood matcher context
 */
export function useMoodMatcher() {
  const context = useContext(MoodMatcherContext);
  if (context === undefined) {
    throw new Error('useMoodMatcher must be used within a MoodMatcherProvider');
  }
  return context;
}

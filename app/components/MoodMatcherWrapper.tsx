import React from 'react';
// Import with full relative path to avoid route conflicts
import MoodMatcherComponent from './MoodMatcher/index';

interface MoodMatcherProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * This is a wrapper component that imports the new modular MoodMatcher component
 * The implementation has been split into smaller components within the MoodMatcher directory
 * to improve maintainability and reduce the complexity of each component.
 */
const MoodMatcherWrapper = ({ isVisible, onClose }: MoodMatcherProps) => {
  return <MoodMatcherComponent isVisible={isVisible} onClose={onClose} />;
}

export default MoodMatcherWrapper;
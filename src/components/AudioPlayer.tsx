import React, { useState } from 'react';

import { useLanguage } from '../contexts/languageContext';
import { speak, stopSpeaking } from '../services/speechService';
import SoundIcon from './icons/SoundIcon';

interface AudioPlayerProps {
  textToSpeak: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ textToSpeak }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { profile } = useLanguage();

  const isDisabled = !textToSpeak || textToSpeak.trim().length === 0;

  const handleEnd = () => setIsPlaying(false);

  const handlePlay = () => {
    speak(textToSpeak, { lang: profile.learning, onEnd: handleEnd, onError: handleEnd });
    setIsPlaying(true);
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPlaying(false);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  return (
    <button
      onClick={togglePlay}
      disabled={isDisabled}
      className="p-2 mt-0.5 rounded-full bg-slate-600/50 hover:bg-slate-600 transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
    >
      {isPlaying ? <StopIcon className="w-5 h-5 text-white" /> : <SoundIcon className="w-5 h-5 text-white" />}
    </button>
  );
};

// A new icon component for the stop button
const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

export default AudioPlayer;

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { RotateCcw, X } from 'lucide-react';

/**
 * ToastUndo Component
 * 
 * Displays a toast with an Undo button and a circular countdown timer.
 * 
 * @param {Object} props
 * @param {Object} props.t - The toast object provided by react-hot-toast
 * @param {string} props.message - Main message to display
 * @param {Function} props.onUndo - Callback when Undo is clicked
 * @param {number} props.duration - Duration in ms (default 4000)
 */
export default function ToastUndo({ t, message, onUndo, duration = 4000 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  // Update timer for visual progress
  useEffect(() => {
    const interval = 50; // Update every 50ms for smooth animation
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - interval));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Calculate generic progress for the circle svg
  // Circumference = 2 * pi * r. Let's say r=10, circ ~ 62.8
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / duration) * circumference;
  const strokeDashoffset = circumference - progress;

  const handleUndo = () => {
    onUndo();
    toast.dismiss(t.id);
  };

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-primary`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-center">
          {/* Circular Countdown */}
          <div className="relative flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center">
             {/* Background Circle */}
             <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="12"
                cy="12"
                r={radius}
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-gray-200"
              />
              {/* Progress Circle */}
              <circle
                cx="12"
                cy="12"
                r={radius}
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-75 ease-linear"
                strokeLinecap="round"
              />
            </svg>
             {/* Center Icon/Text */}
             <span className="text-[9px] font-bold text-gray-500 font-mono">
                {Math.ceil(timeLeft / 1000)}
             </span>
          </div>

          <div className="ml-1 flex-1">
            <p className="text-sm font-medium text-gray-800">
              {message}
            </p>
          </div>
        </div>
      </div>
      
      {/* Undo Button */}
      <div className="flex border-l border-gray-100">
        <button
          onClick={handleUndo}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <RotateCcw size={16} className="mr-2" />
          Deshacer
        </button>
      </div>
    </div>
  );
}

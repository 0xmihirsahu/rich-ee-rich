"use client";
import { useState, useEffect, useRef } from "react";
import { getRandomCharacter } from "@/utils/animations";

export default function TextScramble({ 
  children, 
  scrambleOnMount = true,
  scrambleOnHover = false,
  scrambleCount = 5,
  scrambleDelay = 50
}) {
  const containerRef = useRef(null);
  const [isScrambling, setIsScrambling] = useState(scrambleOnMount);
  const originalTexts = useRef(new Map());
  const intervalRef = useRef(null);

  const scrambleText = async () => {
    if (!containerRef.current) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const textNodes = [];
    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.textContent?.trim()) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      originalTexts.current.set(node, node.textContent || "");
      textNodes.push(node);
    }

    let count = 0;
    intervalRef.current = setInterval(() => {
      textNodes.forEach((node) => {
        const original = originalTexts.current.get(node) || "";
        const scrambled = Array.from(original)
          .map((char) => (char === " " ? char : getRandomCharacter()))
          .join("");
        node.textContent = scrambled;
      });

      count++;
      if (count > scrambleCount) {
        textNodes.forEach((node) => {
          node.textContent = originalTexts.current.get(node) || "";
        });
        setIsScrambling(false);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, scrambleDelay);
  };

  useEffect(() => {
    if (scrambleOnMount) {
      scrambleText();
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scrambleOnMount]);

  return (
    <div 
      ref={containerRef} 
      className="transition-all duration-500"
      onMouseEnter={() => {
        if (scrambleOnHover && !isScrambling) {
          setIsScrambling(true);
          scrambleText();
        }
      }}
    >
      {children}
    </div>
  );
}
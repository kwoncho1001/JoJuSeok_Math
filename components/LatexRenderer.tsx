

import React, { useRef, useEffect, useCallback } from 'react';
import katex from 'katex'; // KaTeX is loaded via importmap

interface LatexRendererProps {
  text: string;
}

// Heuristic pre-processor for LaTeX strings
const preprocessLatexString = (rawText: string): string => {
  // This regex attempts to find a pattern like:
  // 1. A closing '$' (not escaped)
  // 2. Immediately followed by text that is NOT a space and NOT a '$'
  // 3. And that "trailing text" contains an '=' (common in equations)
  // Example: "$a^x=b$ax=b" should become "$a^x=bax=b$"
  // Example: "$A=B$C=D" should become "$A=BC=D$"
  // This helps when the user might have intended a continuous math block but accidentally closed and reopened or missed a delimiter.
  const pattern = /(?<!\\)\$(.*?)(?<!\\)\$(?!\s|\$)([a-zA-Z0-9\s=+\-*/^_]+)/g;

  return rawText.replace(pattern, (match, mathContent, trailingMathLikeText) => {
    // Only merge if the trailing text actually looks like a continuation of a math expression
    if (trailingMathLikeText.includes('=')) {
      // Merge into one math block. Adding a space for readability within the math block.
      // KaTeX typically handles extra spaces well.
      return `$${mathContent}${trailingMathLikeText}$`;
    }
    return match; // If it doesn't look like math, leave it as is
  });
};


export const LatexRenderer: React.FC<LatexRendererProps> = ({ text }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Clear previous content
      ref.current.innerHTML = ''; 

      // Pre-process the text to coalesce math expressions
      const processedText = preprocessLatexString(text);

      // Regex to find inline math expressions: $...$
      // This regex looks for a non-escaped dollar sign, then any characters, then another non-escaped dollar sign.
      // It handles cases where a dollar sign might be escaped (e.g., \$)
      const inlineMathRegex = /(?<!\\)\$(.*?)(?<!\\)\$/g; 
      let lastIndex = 0;
      let match;

      while ((match = inlineMathRegex.exec(processedText)) !== null) {
        // Add preceding plain text
        if (match.index > lastIndex) {
          const plainText = processedText.substring(lastIndex, match.index);
          const textNode = document.createTextNode(plainText);
          ref.current.appendChild(textNode);
        }

        // Render the math expression
        const mathExpression = match[1]; // Content inside the dollar signs
        try {
          const mathHtml = katex.renderToString(mathExpression, {
            throwOnError: false,
            displayMode: false, // For inline math
            strict: false,
          });
          const span = document.createElement('span');
          span.innerHTML = mathHtml;
          ref.current.appendChild(span);
        } catch (e) {
          console.error("KaTeX rendering failed for expression:", mathExpression, e);
          // Fallback to displaying the raw math expression if rendering fails
          const errorTextNode = document.createTextNode(`$${mathExpression}$`);
          ref.current.appendChild(errorTextNode);
        }
        lastIndex = inlineMathRegex.lastIndex;
      }

      // Add any remaining plain text after the last math expression
      if (lastIndex < processedText.length) {
        const plainText = processedText.substring(lastIndex);
        const textNode = document.createTextNode(plainText);
        ref.current.appendChild(textNode);
      }
    }
  }, [text]); // Re-render if the LaTeX text changes

  return <span ref={ref} className="latex-math"></span>;
};
import { useEffect, useRef, useState } from "react";

export function useTypewriter(
  text: string,
  speed = 12,
  active = false,
  onDone?: () => void,
) {
  const [displayed, setDisplayed] = useState(active ? "" : text);
  const cbRef = useRef(onDone);
  cbRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        cbRef.current?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);

  return displayed;
}

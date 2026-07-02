import { RefObject, useEffect, useState } from "react";

/**
 * Measures a container and returns a square board size that fits both the
 * container width and the viewport height. Reacts to resizes.
 */
const useBoardWidth = (ref: RefObject<HTMLElement>): number => {
	const [width, setWidth] = useState(0);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const measure = () => {
			const containerWidth = element.getBoundingClientRect().width;
			setWidth(Math.floor(Math.min(containerWidth, window.innerHeight * 0.72)));
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		window.addEventListener("resize", measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [ref]);

	return width;
};

export default useBoardWidth;

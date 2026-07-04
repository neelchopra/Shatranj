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

		let debounceTimer: ReturnType<typeof setTimeout>;

		const measure = () => {
			const containerWidth = element.getBoundingClientRect().width;
			// visualViewport is a more accurate read of the visible area than
			// innerHeight on mobile, though both shift as browser chrome resizes.
			const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
			setWidth(Math.floor(Math.min(containerWidth, viewportHeight * 0.72)));
		};

		const scheduleMeasure = (delay: number) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(measure, delay);
		};

		const onResize = () => scheduleMeasure(120);

		// Mobile browsers report a shorter innerHeight while the address bar is
		// still visible, then it grows once the bar auto-hides a moment after
		// load — measuring immediately would size the board small, then visibly
		// grow it seconds later, which reads as the page "zooming in". Waiting
		// for that to settle before the first measurement avoids the jump.
		scheduleMeasure(300);

		const observer = new ResizeObserver(onResize);
		observer.observe(element);
		window.addEventListener("resize", onResize);

		return () => {
			clearTimeout(debounceTimer);
			observer.disconnect();
			window.removeEventListener("resize", onResize);
		};
	}, [ref]);

	return width;
};

export default useBoardWidth;

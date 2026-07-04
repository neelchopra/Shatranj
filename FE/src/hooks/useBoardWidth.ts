import { RefObject, useLayoutEffect, useState } from "react";

/**
 * Measures a container and returns a square board size that fits both the
 * container width and the viewport height. Reacts to resizes.
 */
const useBoardWidth = (ref: RefObject<HTMLElement>): number => {
	const [width, setWidth] = useState(0);

	// useLayoutEffect (not useEffect) runs synchronously after the DOM commits
	// but before the browser paints — measuring here means the very first
	// frame already shows the correct size. A useEffect + delay/debounce here
	// instead means the board renders invisible (boardWidth stays 0) for that
	// delay, then suddenly pops in at full size once it fires — a large
	// element abruptly appearing and growing reads as the page "zooming in",
	// which is exactly what a delayed initial measurement caused.
	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;

		const measure = () => {
			const containerWidth = element.getBoundingClientRect().width;
			const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
			setWidth(Math.floor(Math.min(containerWidth, viewportHeight * 0.72)));
		};

		measure();
		let lastWidth = window.innerWidth;

		// Later resizes are debounced so a burst of events settles into a
		// single re-measurement instead of several visible jumps. Mobile
		// browsers also fire resize purely from the address bar collapsing or
		// expanding as the page loads/scrolls — that changes innerHeight but
		// not innerWidth. Reacting to it re-grows or re-shrinks the board a
		// moment after it first renders, which reads as the board "zooming
		// in" even though nothing was pinched or tapped. Only real width
		// changes (orientation, an actual window resize) should trigger a
		// re-measure.
		let debounceTimer: ReturnType<typeof setTimeout>;
		const onResize = () => {
			if (window.innerWidth === lastWidth) return;
			lastWidth = window.innerWidth;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(measure, 120);
		};

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

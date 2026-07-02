import { Variants } from "framer-motion";

export const fadeUp: Variants = {
	initial: { opacity: 0, y: 16 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
	initial: {},
	animate: { transition: { staggerChildren: 0.07 } },
};

export const pageTransition: Variants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
	exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" } },
};

export const springModal = {
	initial: { opacity: 0, scale: 0.92 },
	animate: {
		opacity: 1,
		scale: 1,
		transition: { type: "spring", stiffness: 300, damping: 25 },
	},
	exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

/** Expanding ring used behind the matchmaking spinner. */
export const pulseRing = {
	animate: {
		scale: [1, 1.6],
		opacity: [0.6, 0],
		transition: { duration: 1.8, repeat: Infinity, ease: "easeOut" },
	},
};

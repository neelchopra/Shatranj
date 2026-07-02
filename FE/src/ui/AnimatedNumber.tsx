import React, { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Animates numeric changes with a spring count-up/down.
 */
const AnimatedNumber = ({ value }: { value: number }) => {
	const motionValue = useMotionValue(value);
	const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
	const [display, setDisplay] = useState(value);

	useEffect(() => {
		motionValue.set(value);
	}, [motionValue, value]);

	useEffect(() => {
		const unsubscribe = spring.on("change", (latest) => {
			setDisplay(Math.round(latest));
		});
		return unsubscribe;
	}, [spring]);

	return <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>;
};

export default AnimatedNumber;

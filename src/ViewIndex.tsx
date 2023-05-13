import { useEffect } from "react";
import { useNavigate } from "react-router";

export function ViewIndex() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate('/videos', { replace: true });
	}, []);
	return null;
}

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Login } from "./pages/Auth/Login";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { VerifyCode } from "./pages/Auth/VerifyCode";
import { ResetPassword } from "./pages/Auth/ResetPassword";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/recuperar-senha" element={<ForgotPassword />} />
				<Route path="/verificar-codigo" element={<VerifyCode />} />
				<Route path="/resetar-senha" element={<ResetPassword />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
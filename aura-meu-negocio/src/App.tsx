import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Login } from "./pages/Auth/Login";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { VerifyCode } from "./pages/Auth/VerifyCode";
import { ResetPassword } from "./pages/Auth/ResetPassword";
import { Service } from "./pages/Modules/Service";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/recuperar-senha" element={<ForgotPassword />} />
				<Route path="/verificar-codigo" element={<VerifyCode />} />
				<Route path="/resetar-senha" element={<ResetPassword />} />
				<Route path="/atendimento" element={<Service />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
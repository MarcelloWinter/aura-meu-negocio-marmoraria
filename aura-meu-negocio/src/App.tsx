import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Login } from "./pages/Auth/Login";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { VerifyCode } from "./pages/Auth/VerifyCode";
import { ResetPassword } from "./pages/Auth/ResetPassword";
import { Service } from "./pages/Modules/Service";
import { SidebarProvider } from "./contexts/SidebarContext";

export function App() {
	return (
		<SidebarProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Login />} />
					<Route path="/recuperar-senha" element={<ForgotPassword />} />
					<Route path="/verificar-codigo" element={<VerifyCode />} />
					<Route path="/resetar-senha" element={<ResetPassword />} />
					<Route path="/atendimento" element={<Service />} />
				</Routes>
			</BrowserRouter>
		</SidebarProvider>
	);
}

export default App;
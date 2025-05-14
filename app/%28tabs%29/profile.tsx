import AuthModal from "@/components/AuthModal";
import { useState } from "react";

const [showAuthModal, setShowAuthModal] = useState(false);

{showAuthModal && <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />} 
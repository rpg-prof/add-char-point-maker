import { useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FilePlus2, FolderOpen, ScrollText } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import {
  getActiveCharacter,
  parseCharacterSave,
  setActiveCharacter,
} from "@/lib/characterSave";

const Home = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const active = useMemo(() => getActiveCharacter(), []);

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCharacterSave(JSON.parse(ev.target?.result as string));
        if (!parsed) {
          alert("Arquivo JSON inválido.");
          return;
        }
        setActiveCharacter(parsed);
        navigate("/play");
      } catch {
        alert("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen parchment-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl gilt-card overflow-hidden">
          <div className="dark-panel px-6 py-8 sm:px-10 sm:py-10 text-center border-b border-gold/25">
            <div className="flex justify-center mb-4">
              <AppLogo size={72} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-gold">
              AD&amp;D 2.5 Edition
            </h1>
            <p className="font-body text-sm text-parchment/70 mt-2">
              Ficha de personagem para a mesa
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleOpenFile}
              className="hidden"
            />

            {active && (
              <Button
                onClick={() => navigate("/play")}
                className="w-full h-auto py-4 bg-gold text-parchment-dark hover:bg-gold-glow font-body shadow-[var(--shadow-gold)]"
              >
                <ScrollText className="w-5 h-5 mr-2 shrink-0" />
                <span className="flex flex-col items-start text-left">
                  <span className="font-semibold text-sm">Continuar com</span>
                  <span className="text-xs opacity-80">
                    {active.charName.trim() || "Personagem sem nome"}
                    {active.selectedClass ? ` · ${active.selectedClass}` : ""}
                  </span>
                </span>
              </Button>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-auto py-4 border-gold/40 hover:bg-gold/10 font-body"
            >
              <FolderOpen className="w-5 h-5 mr-2 shrink-0 text-gold" />
              <span className="flex flex-col items-start text-left">
                <span className="font-semibold text-sm text-foreground">Abrir personagem</span>
                <span className="text-xs text-muted-foreground">
                  Carregar um arquivo JSON já criado
                </span>
              </span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-auto py-4 border-gold/40 hover:bg-gold/10 font-body"
            >
              <Link to="/create">
                <FilePlus2 className="w-5 h-5 mr-2 shrink-0 text-gold" />
                <span className="flex flex-col items-start text-left">
                  <span className="font-semibold text-sm text-foreground">Criar novo</span>
                  <span className="text-xs text-muted-foreground">
                    Iniciar a criação de um personagem
                  </span>
                </span>
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground font-body mt-4">
          Sistema AD&amp;D 2.5 — criação, ficha e evolução
        </p>
      </div>
    </div>
  );
};

export default Home;

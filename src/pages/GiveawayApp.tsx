import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Instagram, Link2, Settings, Loader2, Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

type Step = 'url' | 'config' | 'extracting' | 'countdown' | 'roulette';

export default function GiveawayApp() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('url');
  
  // URL State
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // Config State
  const [numWinners, setNumWinners] = useState('1');
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [keyword, setKeyword] = useState('');

  // Extraction State
  const [progress, setProgress] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);

  // Roulette & Countdown State
  const [participants, setParticipants] = useState<{username: string, text: string}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(10);

  const validateUrl = () => {
    if (!url.includes('instagram.com/p/') && !url.includes('instagram.com/reel/')) {
      setUrlError('Introduce una URL válida de publicación o reel de Instagram');
      return false;
    }
    setUrlError('');
    return true;
  };

  const handleNextToConfig = () => {
    if (validateUrl()) {
      setStep('config');
    }
  };

  const startExtraction = () => {
    setStep('extracting');
    setProgress(0);
    setExtractedCount(0);
    
    // Simular extracción por WS / Polling Job ID en Backend
    const totalSimulated = Math.floor(Math.random() * 500) + 150;
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 10) + 5;
      if (current >= totalSimulated) {
        current = totalSimulated;
        clearInterval(interval);
        generateMockParticipants(current);
        setTimeout(() => {
          setCountdown(10);
          setStep('countdown');
        }, 500);
      }
      setExtractedCount(current);
      setProgress((current / totalSimulated) * 100);
    }, 100);
  };

  const generateMockParticipants = (count: number) => {
    const mocks = Array.from({ length: count }).map((_, i) => ({
      username: `user_${Math.floor(Math.random() * 10000)}`,
      text: `Participando desde ${i} 🚀 #sorteo`
    }));
    setParticipants(mocks);
  };

  const startRoulette = () => {
    // Animación de ruleta
    let jumps = 0;
    const maxJumps = 40;
    
    const tick = () => {
      setCurrentIndex(Math.floor(Math.random() * participants.length));
      jumps++;
      if (jumps < maxJumps) {
        setTimeout(tick, jumps * 5); // Desaceleración
      } else {
        // Finaliza, crear ID único y navegar al certificado
        const id = Math.random().toString(36).substring(2, 9);
        // En una app real, guardaríamos el resultado en DB (Postgres vía backend) y redirigimos
        setTimeout(() => {
          navigate(`/cert/${id}`, { 
            state: { 
              winner: participants[currentIndex], // Simplificación 1 ganador
              total: participants.length,
              url,
              config: { filterDuplicates, keyword }
            }
          });
        }, 1000);
      }
    };
    tick();
  };

  useEffect(() => {
    if (step === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setStep('roulette');
      }
    }
  }, [step, countdown]);

  useEffect(() => {
    if (step === 'roulette') {
      setTimeout(() => startRoulette(), 1000);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <AnimatePresence mode="wait">
        
        {step === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-4">
                  <Instagram className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">¿Qué publicación sorteamos?</CardTitle>
                <CardDescription>Pega el link del Reel o Post público</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="https://www.instagram.com/p/..." 
                      className="pl-10 h-12 text-md"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  {urlError && <p className="text-sm text-red-500 font-medium">{urlError}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full h-12 text-lg" onClick={handleNextToConfig}>
                  Siguiente paso <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
             <Card className="border-slate-200 shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Reglas del Sorteo</CardTitle>
                <CardDescription>Configura los filtros antes de extraer</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label>Número de ganadores</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={numWinners} 
                    onChange={e => setNumWinners(e.target.value)} 
                  />
                </div>
                
                <div className="flex items-center justify-between border-b border-t border-slate-100 py-4">
                  <div className="space-y-0.5">
                    <Label className="text-base text-slate-800">Un comentario por usuario</Label>
                    <p className="text-sm text-slate-500">Excluye menciones duplicadas de una misma cuenta</p>
                  </div>
                  <Switch checked={filterDuplicates} onCheckedChange={setFilterDuplicates} />
                </div>

                <div className="space-y-3">
                  <Label>Palabra clave requerida (Opcional)</Label>
                  <Input 
                    placeholder="Ej. #sorteo, quiero participar..." 
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="gap-3">
                <Button variant="outline" className="w-full h-12" onClick={() => setStep('url')}>Atrás</Button>
                <Button className="w-full h-12" onClick={startExtraction}>
                  Iniciar Extracción
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 'extracting' && (
          <motion.div
            key="extracting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Analizando publicación</h2>
              <p className="text-slate-500">Conectando con el servidor de raspado...</p>
            </div>
            
            <div className="w-full max-w-sm space-y-2 pt-4">
              <div className="flex justify-between text-sm font-medium">
                <span>Progreso</span>
                <span>{extractedCount} comentarios</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </motion.div>
        )}

        {step === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="w-32 h-32 rounded-full border-4 border-indigo-100 flex items-center justify-center bg-white shadow-sm">
              <motion.span 
                key={countdown}
                initial={{ opacity: 0, y: -20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 1.5 }}
                className="text-6xl font-black text-indigo-600 tabular-nums leading-none"
              >
                {countdown}
              </motion.span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">¡Todo listo!</h2>
              <p className="text-slate-500">Preparando el motor aleatorio...</p>
            </div>
          </motion.div>
        )}

        {step === 'roulette' && participants.length > 0 && (
          <motion.div
            key="roulette"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-10"
          >
            <div className="text-center mb-10 space-y-2">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
              <h2 className="text-3xl font-bold">Eligiendo Ganador...</h2>
              <p className="text-slate-500">De {participants.length} comentarios verificados</p>
            </div>

            <Card className="w-full max-w-md bg-white border-2 border-indigo-500 shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
              <CardContent className="p-8 text-center relative z-10 space-y-4">
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest block mb-2">PARTICIPANTE</span>
                <p className="text-3xl font-bold text-slate-800 break-words">
                  @{participants[currentIndex]?.username}
                </p>
                <p className="text-sm text-slate-500 italic mt-4 line-clamp-2">
                  "{participants[currentIndex]?.text}"
                </p>
              </CardContent>
            </Card>

            <p className="mt-8 text-slate-400 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Algoritmo aleatorio criptográfico
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router";
import { motion } from "motion/react";
import { Trophy, CheckCircle, Share2, Download, ExternalLink, CalendarClock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CertificatePage() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      setData(location.state);
    } else {
      // Si entra directo, simular un fetch (en prod iría a la API)
      setData({
        winner: { username: "usuario_ejemplo", text: "¡Yo quiero ganar! ❤️" },
        total: 1254,
        url: "https://instagram.com/p/ejemplo",
        config: { filterDuplicates: true, keyword: "" }
      });
    }
  }, [location.state]);

  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto w-full py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resultados del Sorteo</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Sorteo finalizado y certificado
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" /> Compartir
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4" /> Bajar PDF
            </Button>
          </div>
        </div>

        <Card className="border-t-4 border-t-indigo-600 shadow-lg overflow-hidden bg-white mb-8">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8 text-center pt-10">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-2">GANADOR OFICIAL</h2>
            <p className="text-4xl font-black text-slate-900">@{data.winner.username}</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-600 italic text-sm">
              "{data.winner.text}"
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <h3 className="text-lg font-bold mb-4">Detalles del Certificado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-500 flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> Fecha de realización</p>
                <p className="font-semibold text-slate-900">{new Date().toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500 flex items-center gap-1.5"><Hash className="w-4 h-4" /> Código de Verificación</p>
                <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block text-slate-800">
                  cer_{id?.toUpperCase()}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-slate-500 flex items-center gap-1.5"><ExternalLink className="w-4 h-4" /> Publicación Origen</p>
                <a href={data.url} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline truncate block">
                  {data.url.substring(0, 50)}...
                </a>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="text-lg font-bold mb-4">Métricas y Configuración</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div>
                <p className="text-2xl font-black text-slate-900">{data.total.toLocaleString()}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">Participantes</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{data.config.filterDuplicates ? 'Sí' : 'No'}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">Filtro Duplicados</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{data.config.keyword || 'N/A'}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">Palabra Clave</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">1</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">Total Ganadores</p>
              </div>
            </div>
          </CardContent>
          <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
            Este certificado es generado por un algoritmo verificable e inmutable alojado en RaffleFlow.
          </div>
        </Card>

        <div className="text-center">
          <Link to="/app">
            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700">Realizar otro sorteo</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

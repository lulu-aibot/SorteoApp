import { motion } from "motion/react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, ShieldCheck, Zap, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 pt-12 pb-24">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" /> Lanzamiento MVP
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900"
        >
          Sorteos de Instagram <br className="hidden md:block"/> Transparentes y Fáciles
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl"
        >
          Pega el link de tu publicación, configura las reglas y obtén un certificado 100% verificable. Haz crecer tu marca con confianza garantizada.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/app">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700">
              Crear Sorteo Ahora
            </Button>
          </Link>
          <p className="text-sm text-slate-500 mt-4">100% Gratis y sin registro</p>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Zap, title: "Rápido y Automático", desc: "Obtenemos los comentarios en segundos. Configura tu sorteo en menos de un minuto." },
          { icon: ShieldCheck, title: "100% Transparente", desc: "Generamos un certificado inmutable del ganador. Nadie podrá dudar de tu sorteo." },
          { icon: Users, title: "Filtros Avanzados", desc: "Ignora duplicados, busca palabras clave o limita menciones. Tú tienes el control." }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 text-center">
        <h2 className="text-3xl font-bold mb-10">Cuentas que ya confían en nosotros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          <Card className="bg-slate-50 border-none">
            <CardContent className="pt-6">
              <p className="italic text-slate-700 mb-4">"Antes me tomaba horas contar comentarios y revisar menciones. Ahora descargo el certificado y lo publico directo en mis stories. La confianza de mis seguidores subió al 100%."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600" />
                <div>
                  <p className="font-bold text-sm">@moda.lifestyle</p>
                  <p className="text-xs text-slate-500">Agencia Digital</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-none">
            <CardContent className="pt-6">
              <p className="italic text-slate-700 mb-4">"El filtro de usuarios duplicados nos salvó el último gran evento. Es increíble el certificado de transparencia que general. Ultra recomendado para e-commerce."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600" />
                <div>
                  <p className="font-bold text-sm">@techstore_ok</p>
                  <p className="text-xs text-slate-500">E-Commerce</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto w-full">
        <h2 className="text-3xl font-bold mb-8 text-center">Preguntas Frecuentes</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>¿Necesito conectar mi cuenta de Instagram?</AccordionTrigger>
            <AccordionContent>
              No. Con nuestro sistema basta con tener la URL del post. Nuestro sistema se encarga de analizar los comentarios de forma externa para publicaciones públicas. En el futuro ofreceremos opciones de conexión oficial para sortear en cuentas privadas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>¿Cómo se garantiza la transparencia?</AccordionTrigger>
            <AccordionContent>
              El proceso genera un Certificado Único. Utilizamos algoritmos criptográficos para elegir la semilla y guardar registro de hora/fecha. Además el número total de participantes auditados queda sellado en el certificado.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>¿Tiene algún costo?</AccordionTrigger>
            <AccordionContent>
              Nuestra herramienta es 100% gratuita y sin límites. Puedes realizar todos los sorteos que quieras sin necesidad de pagar ni registrarte.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

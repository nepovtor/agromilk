import { Link } from "wouter";
import { Button } from "@/components/ui/button";
export function NotFoundPage() { return <div className="grid min-h-screen place-items-center px-4 text-center"><div><p className="text-sm font-medium text-blue-600">404</p><h1 className="mt-3 text-4xl font-bold">Страница не найдена</h1><p className="mt-3 text-slate-600">Проверьте адрес или вернитесь на главную.</p><Link href="/"><Button className="mt-6">На главную</Button></Link></div></div>; }

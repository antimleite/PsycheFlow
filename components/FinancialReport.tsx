
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentStatus } from '../types';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  FileDown
} from 'lucide-react';

type Period = 'Hoje' | 'Semana' | 'Mês' | 'Ano' | 'Tudo';

const FinancialReport: React.FC = () => {
  const { visiblePayments, visiblePatients } = useApp();
  const [period, setPeriod] = useState<Period>('Mês');
  const [searchTerm, setSearchTerm] = useState('');

  const filterPaymentsByPeriod = (payments: any[], selectedPeriod: Period) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Início da semana (domingo)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // Início do mês
    const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Início do ano
    const startOfYearStr = `${now.getFullYear()}-01-01`;

    return payments.filter(p => {
      if (p.status !== PaymentStatus.PAID) return false;
      
      switch (selectedPeriod) {
        case 'Hoje': return p.date === todayStr;
        case 'Semana': return p.date >= startOfWeekStr;
        case 'Mês': return p.date >= startOfMonthStr;
        case 'Ano': return p.date >= startOfYearStr;
        case 'Tudo': return true;
        default: return true;
      }
    });
  };

  const filteredPayments = useMemo(() => {
    return filterPaymentsByPeriod(visiblePayments, period);
  }, [visiblePayments, period]);

  const financialSummary = useMemo(() => {
    const aggregated: Record<string, { amount: number, lastPayment: string }> = {};
    let totalReceipts = 0;

    filteredPayments.forEach(p => {
      totalReceipts += p.amount;
      if (!aggregated[p.patientId]) {
        aggregated[p.patientId] = { amount: 0, lastPayment: p.date };
      }
      aggregated[p.patientId].amount += p.amount;
      if (p.date > aggregated[p.patientId].lastPayment) {
        aggregated[p.patientId].lastPayment = p.date;
      }
    });

    const patientList = Object.entries(aggregated)
      .map(([id, data]) => ({
        id,
        name: visiblePatients.find(pat => pat.id === id)?.name || 'Paciente Desconhecido',
        ...data
      }))
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.amount - a.amount);

    return { patientList, totalReceipts };
  }, [filteredPayments, visiblePatients, searchTerm]);

  const handleExportPDF = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const rows = financialSummary.patientList.map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-size: 13px; font-weight: 600;">${p.name}</td>
        <td style="padding: 12px; font-size: 13px; text-align: center;">${new Date(p.lastPayment).toLocaleDateString('pt-BR')}</td>
        <td style="padding: 12px; font-size: 13px; font-weight: 800; text-align: right; color: #4f46e5;">R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Relatório Financeiro - PsycheFlow</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0; font-size: 24px; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b; }
            .total { font-size: 20px; font-weight: 800; color: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Relatório Financeiro Personalizado</h1>
              <p>Período selecionado: <strong>${period}</strong></p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">Gerado em</p>
              <strong>${new Date().toLocaleDateString('pt-BR')}</strong>
            </div>
          </div>
          <div class="summary">
            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700;">TOTAL DE RECEBIMENTOS</p>
            <div class="total">R$ ${financialSummary.totalReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th style="text-align: center;">Último Pagamento</th>
                <th style="text-align: right;">Total Pago</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h2>
          <p className="text-gray-500">Visão consolidada de faturamento e pagamentos por paciente.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-all shadow-sm"
        >
          <FileDown size={16} /> Exportar Relatório
        </button>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} className="text-indigo-600" />
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Recebido</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                R$ {financialSummary.totalReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-tight">Período: {period}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Pacientes Pagantes</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{financialSummary.patientList.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ticket Médio</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={24} />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">
              R$ {financialSummary.patientList.length > 0 
                ? (financialSummary.totalReceipts / financialSummary.patientList.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                : '0,00'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 gap-1">
            {(['Hoje', 'Semana', 'Mês', 'Ano', 'Tudo'] as Period[]).map((p) => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  period === p 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar paciente..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-4 py-4">Paciente</th>
                <th className="px-4 py-4 text-center">Último Pagamento no Período</th>
                <th className="px-4 py-4 text-right">Montante Pago</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {financialSummary.patientList.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-5 font-bold text-gray-900 text-sm">
                    {p.name}
                  </td>
                  <td className="px-4 py-5 text-center text-xs text-gray-500 font-medium">
                    {new Date(p.lastPayment).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-5 text-right font-black text-indigo-600 text-sm">
                    R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-5 text-right">
                    <ChevronRight size={16} className="text-gray-200 group-hover:text-indigo-400 transition-colors ml-auto" />
                  </td>
                </tr>
              ))}
              {financialSummary.patientList.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-400 italic text-sm">
                    Nenhum recebimento encontrado no período de {period.toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
            {financialSummary.patientList.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50/30">
                  <td className="px-4 py-6 font-black text-indigo-900 text-sm uppercase tracking-widest">Total Consolidado</td>
                  <td></td>
                  <td className="px-4 py-6 text-right font-black text-indigo-600 text-lg">
                    R$ {financialSummary.totalReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;

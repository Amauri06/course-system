import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import {
  Coins,
  CreditCard,
  PiggyBank,
  Printer,
  Calendar,
  Lock,
  History,
  PenLine,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDateStr } from '../utils/formatters';
import type { CashClosure, Payment } from '../types';
import { format } from 'date-fns';

export const CashRegister: React.FC = () => {
  const { closures, closeActiveClosure, reopenClosure, checkOrCreateDailyClosure, updateSaldoInicial } = useAcademyStore();
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState('');
  const [viewingClosureDetail, setViewingClosureDetail] = useState<CashClosure | null>(null);
  const [editingSaldo, setEditingSaldo] = useState(false);
  const [saldoInput, setSaldoInput] = useState(0);

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  
  // Asegurar que hoy esté inicializada en el frontend
  checkOrCreateDailyClosure();

  // Obtener caja de hoy
  const todayClosure = closures.find((c) => c.fecha === todayDateStr);

  // Clasificación de pagos para el cierre de hoy
  const paymentsEfectivo = todayClosure ? todayClosure.pagos.filter((p) => p.metodoPago === 'efectivo') : [];
  const paymentsTransferencia = todayClosure ? todayClosure.pagos.filter((p) => p.metodoPago === 'transferencia') : [];

  const totalEfectivoSum = paymentsEfectivo.reduce((acc, curr) => acc + curr.montoPagado, 0);
  const totalTransferenciaSum = paymentsTransferencia.reduce((acc, curr) => acc + curr.montoPagado, 0);

  // Cierres históricos (excluye hoy, o incluye hoy si ya está cerrado)
  const historyClosures = closures.filter((c) => {
    const matchesDate = !selectedHistoryDate || c.fecha === selectedHistoryDate;
    // Mostrar cierres anteriores, o el de hoy si ya está cerrado
    return (c.fecha !== todayDateStr || c.cerrado) && matchesDate;
  });

  const handleCloseBox = () => {
    if (confirm('¿Está seguro de realizar el Cierre de Caja del día de hoy? Una vez cerrado, no se podrán realizar nuevas inscripciones para esta fecha.')) {
      closeActiveClosure();
      toast.success('Caja cerrada correctamente');
    }
  };

  const handlePrintPastClosure = (closure: CashClosure) => {
    setViewingClosureDetail(closure);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const columnsEfectivo = [
    {
      key: 'matricula',
      header: 'Matrícula',
      render: (row: Payment) => <span className="font-mono text-xs font-bold text-slate-400">{row.matricula}</span>
    },
    {
      key: 'estudianteNombre',
      header: 'Estudiante',
      render: (row: Payment) => <span className="font-bold text-slate-800">{row.estudianteNombre}</span>
    },
    {
      key: 'cursoNombre',
      header: 'Curso',
      render: (row: Payment) => <span className="text-xs text-slate-500 font-bold">{row.cursoNombre}</span>
    },
    {
      key: 'hora',
      header: 'Hora',
      render: (row: Payment) => <span className="text-xs text-slate-400 font-bold">{row.hora}</span>
    },
    {
      key: 'montoPagado',
      header: 'Monto',
      align: 'right' as const,
      render: (row: Payment) => <span className="font-extrabold text-slate-800">{formatCurrency(row.montoPagado)}</span>
    }
  ];

  const columnsTransferencia = [
    {
      key: 'matricula',
      header: 'Matrícula',
      render: (row: Payment) => <span className="font-mono text-xs font-bold text-slate-400">{row.matricula}</span>
    },
    {
      key: 'estudianteNombre',
      header: 'Estudiante',
      render: (row: Payment) => <span className="font-bold text-slate-800">{row.estudianteNombre}</span>
    },
    {
      key: 'cursoNombre',
      header: 'Curso',
      render: (row: Payment) => <span className="text-xs text-slate-500 font-bold">{row.cursoNombre}</span>
    },
    {
      key: 'referenciaTransferencia',
      header: 'Referencia Banco',
      render: (row: Payment) => <span className="font-mono text-xs font-extrabold text-slate-400">{row.referenciaTransferencia || 'N/A'}</span>
    },
    {
      key: 'hora',
      header: 'Hora',
      render: (row: Payment) => <span className="text-xs text-slate-400 font-bold">{row.hora}</span>
    },
    {
      key: 'montoPagado',
      header: 'Monto',
      align: 'right' as const,
      render: (row: Payment) => <span className="font-extrabold text-slate-800">{formatCurrency(row.montoPagado)}</span>
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Printable Area - Past Closure details */}
      {viewingClosureDetail && (
        <div id="closure-printable" className="text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide">Reporte de Cierre de Caja Diario</h2>
          <p className="text-xs font-semibold">Resumen Administrativo y Fiscal</p>
          <div className="border-b border-slate-400 my-4" />
          <div className="grid grid-cols-2 text-left text-xs gap-1.5 font-bold mb-4">
            <span>Fecha Caja: {viewingClosureDetail.fecha}</span>
            <span>Total Recaudado: {formatCurrency(viewingClosureDetail.totalGeneral)}</span>
            <span>Total Efectivo: {formatCurrency(viewingClosureDetail.totalEfectivo)}</span>
            <span>Total Transferencia: {formatCurrency(viewingClosureDetail.totalTransferencia)}</span>
            <span>Cantidad Transacciones: {viewingClosureDetail.cantidadPagos}</span>
            <span>Inscritos Nuevos: {viewingClosureDetail.cantidadEstudiantesInscritos}</span>
          </div>
          <div className="border-b border-slate-400 mb-4" />
          <h3 className="text-sm font-bold text-left mb-2">Desglose de Cobros:</h3>
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-400 font-bold uppercase">
                <th className="py-2">Matrícula</th>
                <th className="py-2">Estudiante</th>
                <th className="py-2">Curso</th>
                <th className="py-2">Método</th>
                <th className="py-2">Referencia</th>
                <th className="py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {viewingClosureDetail.pagos.map((payment: Payment) => (
                <tr key={payment.id} className="border-b border-slate-200">
                  <td className="py-2 font-mono">{payment.matricula}</td>
                  <td className="py-2 font-bold">{payment.estudianteNombre}</td>
                  <td className="py-2">{payment.cursoNombre}</td>
                  <td className="py-2 uppercase">{payment.metodoPago}</td>
                  <td className="py-2 font-mono">{payment.referenciaTransferencia || 'N/A'}</td>
                  <td className="py-2 text-right font-extrabold">{formatCurrency(payment.montoPagado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Header (No-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 no-print">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
            Cierre de Caja Diario
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Cuadra tus cobros diarios en efectivo y transferencia bancaria. Revisa el historial de cierres históricos.
          </p>
        </div>

        {/* Selector de Pestaña */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'today' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PiggyBank className="w-4 h-4 text-brand-600" />
            Caja de Hoy
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            Historial de Caja
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA CAJA DE HOY */}
      {/* ========================================================================= */}
      {activeTab === 'today' && todayClosure && (
        <div className="flex flex-col gap-8 no-print animate-fade-in">
          {/* Alertas de Caja Abierta / Cerrada */}
          {todayClosure.cerrado ? (
            <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-100 border border-slate-200 rounded-2xl p-4 text-slate-600">
              <div className="flex items-center gap-3">
                <Lock className="w-5.5 h-5.5 text-slate-400 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">Caja Cerrada</span>
                  <span className="text-xs font-semibold text-slate-400">No se pueden registrar cobros hasta reabrirla.</span>
                </div>
              </div>
              <Button variant="outline" size="sm" icon={<Lock className="w-4 h-4" />} onClick={() => { reopenClosure(); toast.success('Caja reabierta correctamente'); }}>
                Reabrir Caja
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4 bg-emerald-50 border border-emerald-100/70 p-4.5 rounded-2xl text-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">Caja Abierta y Activa</span>
                  <span className="text-xs font-semibold text-emerald-600/80">Recibiendo cobros de inscripciones del día de hoy.</span>
                </div>
              </div>
              <Button variant="danger" size="sm" icon={<Lock className="w-4 h-4" />} onClick={handleCloseBox}>
                Cerrar Caja de Hoy
              </Button>
            </div>
          )}

          {/* Cards de Métodos de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Efectivo Card */}
            <Card title="Efectivo Recibido" className="bg-linear-to-br from-emerald-500/5 to-teal-500/5 border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cobros en Efectivo</span>
                  <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none my-1">
                    {formatCurrency(totalEfectivoSum)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{paymentsEfectivo.length} Transacciones</span>
                </div>
                <div className="p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                  <Coins className="w-5.5 h-5.5" />
                </div>
              </div>
            </Card>

            {/* Transferencia Card */}
            <Card title="Transferencia Recibida" className="bg-linear-to-br from-sky-500/5 to-indigo-500/5 border-sky-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cobros en Transferencia</span>
                  <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none my-1">
                    {formatCurrency(totalTransferenciaSum)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{paymentsTransferencia.length} Transacciones</span>
                </div>
                <div className="p-3.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
                  <CreditCard className="w-5.5 h-5.5" />
                </div>
              </div>
            </Card>

            {/* Total Balance general Card */}
            <Card title="Balance General de Caja" className="bg-linear-to-br from-brand-500/5 to-indigo-500/5 border-brand-100">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Recaudado Hoy</span>
                    <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none my-1">
                      {formatCurrency(todayClosure.totalGeneral)}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{todayClosure.cantidadPagos} Transacciones totales</span>
                  </div>
                  <div className="p-3.5 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl">
                    <PiggyBank className="w-5.5 h-5.5" />
                  </div>
                </div>
                <div className="border-t border-brand-100 pt-3 mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Fondo Inicial</span>
                  <div className="flex items-center gap-2">
                    {editingSaldo ? (
                      <>
                        <input
                          type="number"
                          value={saldoInput}
                          onChange={(e) => setSaldoInput(Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-hidden focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updateSaldoInicial(todayDateStr, saldoInput);
                            setEditingSaldo(false);
                            toast.success('Saldo inicial actualizado');
                          }}
                          className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-slate-600">+ {formatCurrency(todayClosure.saldoInicial ?? 0)}</span>
                        {!todayClosure.cerrado && (
                          <button
                            onClick={() => {
                              setSaldoInput(todayClosure.saldoInicial ?? 0);
                              setEditingSaldo(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar fondo inicial"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Total en Caja</span>
                  <span className="text-lg font-black text-slate-800">{formatCurrency((todayClosure.saldoInicial ?? 0) + todayClosure.totalGeneral)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Tablas Detalladas por Método de Pago */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card title="Detalle de Cobros en Efectivo" subtitle="Lista de transacciones físicas registradas">
              <Table
                columns={columnsEfectivo}
                data={paymentsEfectivo}
                keyExtractor={(row) => row.id}
              />
            </Card>
            <Card title="Detalle de Cobros en Transferencia" subtitle="Lista de transferencias bancarias a validar">
              <Table
                columns={columnsTransferencia}
                data={paymentsTransferencia}
                keyExtractor={(row) => row.id}
              />
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA HISTORIAL DE CIERRES */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-6 no-print animate-fade-in">
          {/* Filtro de Búsqueda por Fecha */}
          <div className="max-w-md">
            <Input
              type="date"
              label="Filtrar Cierre por Fecha"
              value={selectedHistoryDate}
              onChange={(e) => setSelectedHistoryDate(e.target.value)}
              icon={<Calendar className="w-4.5 h-4.5 text-slate-400" />}
            />
          </div>

          <Card title="Cierres de Caja Anteriores" subtitle="Listado contable histórico">
            {historyClosures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <History className="w-10 h-10 text-slate-200 mb-3" />
                <span className="text-xs font-bold text-slate-400 mb-1">No hay cierres anteriores registrados</span>
                <p className="text-[10px] text-slate-450 max-w-xs">
                  Los cierres de caja anteriores aparecerán en esta lista una vez que completes el cierre diario activo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Fecha Cierre</th>
                      <th className="px-6 py-4">Total Efectivo</th>
                      <th className="px-6 py-4">Total Transferencia</th>
                      <th className="px-6 py-4">Total General</th>
                      <th className="px-6 py-4 text-center">Transacciones</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyClosures.map((closure) => (
                      <tr key={closure.id} className="text-slate-700 font-medium hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{formatDateStr(closure.fecha)}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(closure.totalEfectivo)}</td>
                        <td className="px-6 py-4 font-semibold text-sky-600">{formatCurrency(closure.totalTransferencia)}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">{formatCurrency(closure.totalGeneral)}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-500">{closure.cantidadPagos}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="secondary">
                            Cerrado
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Printer className="w-4 h-4" />}
                            onClick={() => handlePrintPastClosure(closure)}
                          >
                            Imprimir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default CashRegister;

import React, { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Settings2,
  DollarSign,
  Save,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { config, addHorario, updateHorario, deleteHorario, updateConfig } = useAcademyStore();

  const [activeTab, setActiveTab] = useState<'horarios' | 'sistema' | 'pagos'>('horarios');

  // Horario modal state
  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false);
  const [editingHorarioId, setEditingHorarioId] = useState<string | null>(null);
  const [horarioValue, setHorarioValue] = useState('');
  const [horarioLabel, setHorarioLabel] = useState('');
  const [horarioError, setHorarioError] = useState('');

  const tabs = [
    { id: 'horarios' as const, label: 'Horarios', icon: <Clock className="w-4 h-4" /> },
    { id: 'sistema' as const, label: 'Sistema', icon: <Settings2 className="w-4 h-4" /> },
    { id: 'pagos' as const, label: 'Pagos', icon: <DollarSign className="w-4 h-4" /> },
  ];

  const openAddHorario = () => {
    setEditingHorarioId(null);
    setHorarioValue('');
    setHorarioLabel('');
    setHorarioError('');
    setIsHorarioModalOpen(true);
  };

  const openEditHorario = (h: { id: string; value: string; label: string }) => {
    setEditingHorarioId(h.id);
    setHorarioValue(h.value);
    setHorarioLabel(h.label);
    setHorarioError('');
    setIsHorarioModalOpen(true);
  };

  const handleSaveHorario = () => {
    if (!horarioValue.trim() || !horarioLabel.trim()) {
      setHorarioError('Todos los campos son obligatorios.');
      return;
    }
    if (editingHorarioId) {
      updateHorario(editingHorarioId, { value: horarioValue.trim(), label: horarioLabel.trim() });
    } else {
      addHorario({ value: horarioValue.trim(), label: horarioLabel.trim() });
    }
    setIsHorarioModalOpen(false);
    setEditingHorarioId(null);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-md shadow-brand-200">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configuración</h1>
            <p className="text-sm font-semibold text-slate-400">Personaliza el comportamiento del sistema</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'horarios' && (
        <Card title="Horarios Disponibles" subtitle="Gestiona las tandas y horarios para inscripciones">
          {config.horarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 text-slate-200 mb-2" />
              <span className="text-xs font-bold">No hay horarios configurados</span>
              <p className="text-[10px] text-slate-300 mt-1">Agrega horarios para que aparezcan en el formulario de inscripción.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {config.horarios.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{h.label}</span>
                      <span className="text-xs font-semibold text-slate-400">{h.value}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditHorario(h)}
                      className="p-2 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteHorario(h.id)}
                      className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddHorario}>
              Agregar Horario
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'sistema' && (
        <Card title="Configuración del Sistema" subtitle="Parámetros generales del sistema">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Símbolo de Moneda"
              value={config.moneda}
              onChange={(e) => updateConfig({ moneda: e.target.value })}
              placeholder="$"
              icon={<DollarSign className="w-4.5 h-4.5 text-slate-400" />}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Edad Mínima (Cursos Normales)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.edadMinimaNormal}
                  onChange={(e) => updateConfig({ edadMinimaNormal: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm transition-all duration-200 focus:outline-hidden focus:ring-4"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Edad Mínima (Cursos de Inglés)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.edadMinimaIngles}
                  onChange={(e) => updateConfig({ edadMinimaIngles: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-brand-100 focus:border-brand-500 rounded-xl text-slate-800 text-sm transition-all duration-200 focus:outline-hidden focus:ring-4"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100/80 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
              Los cambios en las edades mínimas aplicarán a nuevas inscripciones. Las inscripciones existentes no se verán afectadas.
            </p>
          </div>
        </Card>
      )}

      {activeTab === 'pagos' && (
        <Card title="Configuración de Pagos" subtitle="Valores por defecto para cobros">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Costo por Defecto ($)"
              type="number"
              value={config.costoDefault}
              onChange={(e) => updateConfig({ costoDefault: Number(e.target.value) })}
              placeholder="250"
              icon={<DollarSign className="w-4.5 h-4.5 text-slate-400" />}
            />
            <Select
              label="Modo de Impresión por Defecto"
              value={config.modoImpresionDefault}
              onChange={(e) => updateConfig({ modoImpresionDefault: e.target.value as 'ticket' | 'fullpage' })}
              options={[
                { value: 'fullpage', label: 'Hoja Completa (Carta)' },
                { value: 'ticket', label: 'Ticket (80mm)' },
              ]}
            />
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4">
            Estos valores se usarán como predeterminados al registrar nuevos cobros. El usuario podrá cambiarlos en cada transacción.
          </p>
        </Card>
      )}

      {/* Horario Modal */}
      <Modal
        isOpen={isHorarioModalOpen}
        onClose={() => setIsHorarioModalOpen(false)}
        title={editingHorarioId ? 'Editar Horario' : 'Agregar Horario'}
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Valor del Horario"
            value={horarioValue}
            onChange={(e) => { setHorarioValue(e.target.value); setHorarioError(''); }}
            placeholder="9:00 am - 12:00 pm"
          />
          <Input
            label="Etiqueta de Mostrar"
            value={horarioLabel}
            onChange={(e) => { setHorarioLabel(e.target.value); setHorarioError(''); }}
            placeholder="Mañana (9:00 am - 12:00 pm)"
          />
          {horarioError && (
            <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              {horarioError}
            </p>
          )}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsHorarioModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1" icon={<Save className="w-4 h-4" />} onClick={handleSaveHorario}>
              {editingHorarioId ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
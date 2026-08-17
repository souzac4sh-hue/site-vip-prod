import React, { useState, useEffect } from 'react';
import {
  Lock,
  LayoutDashboard,
  Radio,
  CreditCard,
  KeyRound,
  Settings,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Save,
  Shield,
  Clock,
  Sparkles,
  BarChart3,
  FileText,
  Smartphone,
  MessageCircle,
  Eye,
  Send,
  Plus,
  TrendingUp,
  Zap,
  Bell,
  Video,
  Image,
  HelpCircle,
  Check,
} from 'lucide-react';
import { api } from '../utils/api';
import { TurnstileChallenge } from '../components/TurnstileChallenge';
import {
  LiveConfig,
  AdminStats,
  PaymentTransaction,
  AccessSession,
  StreamStatus,
  FunnelMetrics,
  StaffAnnouncement,
  AnnouncementConfig,
  BenefitItem,
  FAQItem,
} from '../types';

interface CustomChatTemplate {
  id: string;
  authorName: string;
  text: string;
  isModerator?: boolean;
}

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('pl_admin_token') || '');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'live' | 'content' | 'announcements' | 'chat' | 'metrics' | 'payments' | 'sessions' | 'settings'
  >('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [config, setConfig] = useState<LiveConfig | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [sessions, setSessions] = useState<AccessSession[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ sessionId: string; displayName: string; minutesAgo: number }>>([]);
  const [templates, setTemplates] = useState<CustomChatTemplate[]>([]);
  const [announcements, setAnnouncements] = useState<StaffAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');

  // Custom Message Injection Form
  const [customAuthor, setCustomAuthor] = useState<string>('Rodrigo_SP');
  const [customText, setCustomText] = useState<string>('');
  const [customIsMod, setCustomIsMod] = useState<boolean>(false);

  // New Template Form
  const [newTplAuthor, setNewTplAuthor] = useState<string>('');
  const [newTplText, setNewTplText] = useState<string>('');
  const [newTplIsMod, setNewTplIsMod] = useState<boolean>(false);
  const [chatFeedback, setChatFeedback] = useState<string>('');

  // Announcements Form & Config
  const [newAnnAuthor, setNewAnnAuthor] = useState<string>('Equipe de Produção');
  const [newAnnMessage, setNewAnnMessage] = useState<string>('');

  // Benefit / FAQ Modal helpers
  const [newBenefitTitle, setNewBenefitTitle] = useState<string>('');
  const [newBenefitDesc, setNewBenefitDesc] = useState<string>('');
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>('');

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, metricsRes, configRes, paymentsRes, sessionsRes] = await Promise.all([
        api.getAdminStats(token),
        api.getAdminMetrics(token),
        api.getAdminConfig(token),
        api.getAdminPayments(token),
        api.getAdminSessions(token),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (metricsRes.success) setMetrics(metricsRes.metrics);
      if (configRes.success) {
        setConfig(configRes.config);
      }
      if (paymentsRes.success) setPayments(paymentsRes.payments);
      if (sessionsRes.success) setSessions(sessionsRes.sessions);

      // Load active chat users
      try {
        const chatRes = await fetch('/api/admin/chat/users', { headers: { 'x-admin-token': token } });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.success) setOnlineUsers(chatData.users || []);
        }
      } catch (e) {}

      // Load chat templates
      try {
        const tplRes = await fetch('/api/admin/chat/templates', { headers: { 'x-admin-token': token } });
        if (tplRes.ok) {
          const tplData = await tplRes.json();
          if (tplData.success) setTemplates(tplData.templates || []);
        }
      } catch (e) {}

      // Load announcements
      try {
        const annRes = await fetch('/api/admin/announcements', { headers: { 'x-admin-token': token } });
        if (annRes.ok) {
          const annData = await annRes.json();
          if (annData.success) setAnnouncements(annData.announcements || []);
        }
      } catch (e) {}
    } catch (err: any) {
      console.warn('Warning loading admin data:', err);
      if (err?.status === 401) {
        localStorage.removeItem('pl_admin_token');
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.adminLogin(passwordInput, turnstileToken);
      if (res.success && res.token) {
        localStorage.setItem('pl_admin_token', res.token);
        setToken(res.token);
      } else {
        setLoginError(res.message || 'Senha ou credenciais incorretas.');
      }
    } catch (err: any) {
      setLoginError('Erro ao efetuar login.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('pl_admin_token');
    setToken('');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setLoading(true);
    setSaveSuccess('');
    try {
      const res = await api.updateAdminConfig(token, config);
      if (res.success) {
        setConfig(res.config);
        setSaveSuccess('Configurações salvas com sucesso!');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Deseja revogar o acesso desta sessão imediatamente?')) return;
    try {
      const res = await api.revokeSession(token, sessionId);
      if (res.success) {
        loadAllData();
      }
    } catch (err) {
      alert('Erro ao revogar sessão.');
    }
  };

  const handleInjectCustomMessage = async (author: string, text: string, isMod: boolean = false) => {
    if (!text.trim()) return;
    try {
      const res = await fetch('/api/admin/chat/inject-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          authorName: author.trim() || 'VIP',
          text: text.trim(),
          isModerator: isMod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatFeedback(`Mensagem de "${author}" enviada para a sala ao vivo!`);
        setTimeout(() => setChatFeedback(''), 4000);
      }
    } catch (e) {}
  };

  const handleAddNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplAuthor.trim() || !newTplText.trim()) return;

    try {
      const res = await fetch('/api/admin/chat/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          authorName: newTplAuthor.trim(),
          text: newTplText.trim(),
          isModerator: newTplIsMod,
        }),
      });
      const data = await res.json();
      if (data.success && data.template) {
        setTemplates((prev) => [...prev, data.template]);
        setNewTplAuthor('');
        setNewTplText('');
        setNewTplIsMod(false);
      }
    } catch (e) {}
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/admin/chat/templates/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {}
  };

  const handleClearChatHistory = async () => {
    if (!confirm('Deseja limpar todo o histórico de mensagens do chat da live?')) return;
    try {
      const res = await fetch('/api/admin/chat/clear', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setChatFeedback('Histórico do chat limpo com sucesso!');
        setTimeout(() => setChatFeedback(''), 4000);
      }
    } catch (e) {}
  };

  // Staff Announcements Actions
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnAuthor.trim() || !newAnnMessage.trim()) return;

    const newAnn: StaffAnnouncement = {
      id: `ann_${Date.now()}`,
      authorName: newAnnAuthor.trim(),
      role: '',
      message: newAnnMessage.trim(),
      avatarUrl: newAnnAuthor.toLowerCase().includes('sara') ? config?.creator.avatarUrl : undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updated = [...announcements, newAnn];
    setAnnouncements(updated);
    setNewAnnMessage('');
    setChatFeedback('Comunicado salvo no mural com sucesso!');
    setTimeout(() => setChatFeedback(''), 4000);

    try {
      if (config) {
        await api.updateAdminConfig(token, {
          ...config,
          announcements: updated,
        });
      }
    } catch (e) {}
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    try {
      if (config) {
        await api.updateAdminConfig(token, {
          ...config,
          announcements: updated,
        });
      }
    } catch (e) {}
  };

  // Add / Remove Benefits
  const handleAddBenefit = () => {
    if (!config || !newBenefitTitle.trim()) return;
    const newItems = [...(config.content?.benefits || []), { icon: 'Video', title: newBenefitTitle.trim(), description: newBenefitDesc.trim() }];
    setConfig({ ...config, content: { ...config.content, benefits: newItems } });
    setNewBenefitTitle('');
    setNewBenefitDesc('');
  };

  const handleRemoveBenefit = (index: number) => {
    if (!config) return;
    const newItems = (config.content?.benefits || []).filter((_, i) => i !== index);
    setConfig({ ...config, content: { ...config.content, benefits: newItems } });
  };

  // Add / Remove FAQ
  const handleAddFaq = () => {
    if (!config || !newFaqQuestion.trim()) return;
    const newFaqs = [...(config.content?.faqs || []), { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }];
    setConfig({ ...config, content: { ...config.content, faqs: newFaqs } });
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleRemoveFaq = (index: number) => {
    if (!config) return;
    const newFaqs = (config.content?.faqs || []).filter((_, i) => i !== index);
    setConfig({ ...config, content: { ...config.content, faqs: newFaqs } });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 selection:bg-brand-500">
        <div className="w-full max-w-sm bg-[#101010] border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-500 shadow-brand">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white">Painel Administrativo</h1>
          <p className="text-xs text-zinc-400 mt-1 mb-5">
            Autenticação segura com proteção anti-bot Turnstile.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Senha administrativa"
                required
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <TurnstileChallenge onVerify={(t) => setTurnstileToken(t)} />

            {loginError && <p className="text-xs text-rose-400 font-medium">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand"
            >
              Acessar Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0c0c0d] p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_10px_#FF295C]" />
            <span className="font-extrabold text-sm tracking-wider uppercase">
              Admin • Private Live
            </span>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
              { id: 'live', label: 'Player & Vídeo Teaser', icon: Radio },
              { id: 'content', label: 'Editor de Copy & Textos', icon: FileText },
              { id: 'announcements', label: 'Mural de Comunicados', icon: Bell },
              { id: 'metrics', label: 'Métricas & Funil', icon: BarChart3 },
              { id: 'payments', label: 'Pagamentos', icon: CreditCard },
              { id: 'sessions', label: 'Acessos Ativos', icon: KeyRound },
              { id: 'settings', label: 'Gateway & Configs', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-brand'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/[0.08] mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs text-zinc-400 font-mono">Conectado</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {activeTab === 'overview' && 'Visão Geral do Sistema'}
              {activeTab === 'live' && 'Configurações do Player, Prévia (Foto/Vídeo) e Streaming'}
              {activeTab === 'content' && 'Editor 100% Completo da Landing Page & Garantia'}
              {activeTab === 'announcements' && 'Chat ao Vivo • Mural de Comunicados (Abaixo do Vídeo)'}
              {activeTab === 'chat' && 'Controle e Injeção de Mensagens no Chat da Live'}
              {activeTab === 'metrics' && 'Analytics & Funil de Conversão'}
              {activeTab === 'payments' && 'Histórico de Pagamentos PIX'}
              {activeTab === 'sessions' && 'Gerenciamento de Acessos'}
              {activeTab === 'settings' && 'Configurações de Gateway e Segurança'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalize o player, fotos, vídeos, copies, comunicados e métricas em tempo real.
            </p>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Recarregar Dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl glass-card border border-white/[0.06]">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Faturamento Total</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-white font-sans">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                </span>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  Hoje: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.todayRevenue)}
                </span>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-white/[0.06]">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Pagamentos Aprovados</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-white font-sans">{stats.paidPayments}</span>
                <span className="text-[11px] text-zinc-400 block mt-1">De {stats.totalPayments} cobranças geradas</span>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-white/[0.06]">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Cliques no WhatsApp</span>
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-white font-sans">{stats.whatsappRedirects || 0}</span>
                <span className="text-[11px] text-emerald-400 block mt-1">Pessoas que chamaram</span>
              </div>

              <div className="p-5 rounded-2xl glass-card border border-white/[0.06]">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Acessos Ativos</span>
                  <Users className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-2xl font-black text-white font-sans">{stats.activeSessions}</span>
                <span className="text-[11px] text-zinc-400 block mt-1">Compradores com passe ativo</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-brand-500" />
                <span>Alternador Rápido de Status da Transmissão</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {(['offline', 'scheduled', 'live', 'ended'] as StreamStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={async () => {
                      if (!config) return;
                      const res = await api.updateAdminConfig(token, { status: st });
                      if (res.success) {
                        setConfig(res.config);
                        loadAllData();
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      config?.status === st
                        ? 'bg-brand-500 text-white shadow-brand'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {st === 'live' && '● Ao Vivo'}
                    {st === 'scheduled' && 'Evento Programado'}
                    {st === 'offline' && 'Offline / Prévia'}
                    {st === 'ended' && 'Encerrada'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTROLE DA LIVE & PLAYER (FOTO VS VÍDEO) */}
        {activeTab === 'live' && config && (
          <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl animate-fade-in">
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {/* Configuração da Prévia da Landing Page (Foto ou Vídeo com Blur) */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-5">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <Video className="w-4 h-4 text-brand-500" />
                <span>Mídia da Prévia no Player da Landing Page</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Tipo de Prévia no Player
                  </label>
                  <select
                    value={config.creator?.previewMediaType || 'image'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        creator: { ...config.creator, previewMediaType: e.target.value as any },
                      })
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="image">🖼️ Foto / Capa Estática (com botão de Play)</option>
                    <option value="video">🎥 Vídeo Teaser (com Áudio Ativável e Blur)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Nível de Desfoque (Blur do Vídeo/Foto)
                  </label>
                  <select
                    value={config.creator?.previewBlur || 'medium'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        creator: { ...config.creator, previewBlur: e.target.value as any },
                      })
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="light">Desfoque Leve (Visível com blur suave)</option>
                    <option value="medium">Desfoque Médio (Padrão de Proteção)</option>
                    <option value="heavy">Desfoque Forte (Bloqueio total de formas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  URL da Imagem de Capa (Poster da Landing)
                </label>
                <input
                  type="text"
                  value={config.creator?.coverUrl || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      creator: { ...config.creator, coverUrl: e.target.value },
                    })
                  }
                  placeholder="Ex: /creator/cover.jpg ou https://sua-imagem.com/capa.jpg"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  URL do Vídeo Teaser da Landing (MP4 ou WebM — Vídeo que roda no player com áudio ativável)
                </label>
                <input
                  type="text"
                  value={config.creator?.previewVideoUrl || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      creator: { ...config.creator, previewVideoUrl: e.target.value },
                    })
                  }
                  placeholder="Ex: https://seuservidor.com/teaser.mp4"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            {/* URL da Sala Real e Oferta */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-5">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400">
                Transmissão da Sala Privada Protegida (/live)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Status da Sala</label>
                  <select
                    value={config.status}
                    onChange={(e) => setConfig({ ...config, status: e.target.value as StreamStatus })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="live">Ao Vivo (Live)</option>
                    <option value="scheduled">Evento Programado (Countdown)</option>
                    <option value="offline">Offline / Prévia</option>
                    <option value="ended">Encerrada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Preço da Transmissão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={config.price}
                    onChange={(e) => setConfig({ ...config, price: parseFloat(e.target.value) || 9.90 })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-400 mb-1.5">
                    👥 Espectadores Online no Player (Ex: 1480)
                  </label>
                  <input
                    type="number"
                    value={config.onlineViewersCount || 1480}
                    onChange={(e) => setConfig({ ...config, onlineViewersCount: parseInt(e.target.value, 10) || 1480 })}
                    placeholder="1480"
                    className="w-full bg-zinc-900 border border-brand-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  URL da Transmissão ao Vivo (HLS .m3u8, Cloudflare Stream ou MP4 da Sala VIP)
                </label>
                <input
                  type="text"
                  value={config.streamUrl}
                  onChange={(e) => setConfig({ ...config, streamUrl: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Link do WhatsApp da Modelo
                </label>
                <input
                  type="text"
                  value={config.whatsappLink || ''}
                  onChange={(e) => setConfig({ ...config, whatsappLink: e.target.value })}
                  placeholder="https://wa.me/5511999999999?text=..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Link do Grupo/Canal de Prévias (Telegram ou WhatsApp de Prévias Gratuitas)
                </label>
                <input
                  type="text"
                  value={config.previewsGroupLink || ''}
                  onChange={(e) => setConfig({ ...config, previewsGroupLink: e.target.value })}
                  placeholder="https://t.me/+seu_canal_de_previas"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações do Player</span>
            </button>
          </form>
        )}

        {/* TAB 3: EDITOR 100% COMPLETO DE COPY & TEXTOS DA LANDING */}
        {activeTab === 'content' && config && (
          <form onSubmit={handleSaveConfig} className="space-y-8 max-w-4xl animate-fade-in">
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {/* 0. Perfil da Criadora / Modelo */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                <span>0. Perfil & Identidade da Modelo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nome da Modelo</label>
                  <input
                    type="text"
                    value={config.creator?.name || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        creator: { ...config.creator, name: e.target.value },
                      })
                    }
                    placeholder="Ex: Sara, Isabella Fontana"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Username (@)</label>
                  <input
                    type="text"
                    value={config.creator?.username || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        creator: { ...config.creator, username: e.target.value },
                      })
                    }
                    placeholder="Ex: sara.vip, isabellafontana"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Bio / Descrição Curta</label>
                <input
                  type="text"
                  value={config.creator?.bio || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      creator: { ...config.creator, bio: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Foto de Perfil Principal (Landing Page & Player)
                  </label>
                  <input
                    type="text"
                    value={config.creator?.avatarUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        creator: { ...config.creator, avatarUrl: e.target.value },
                      })
                    }
                    placeholder="/creator/avatar.jpg ou https://..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1.5">
                    📸 Foto Exclusiva da Página do WhatsApp (/whatsapp)
                  </label>
                  <input
                    type="text"
                    value={config.creator?.whatsappAvatarUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        creator: { ...config.creator, whatsappAvatarUrl: e.target.value },
                      })
                    }
                    placeholder="Deixe vazio para usar a foto principal ou cole a URL"
                    className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 1. Hero Principal & Copy Livre */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                <span>1. Textos do Hero & Carta de Vendas Livre</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Headline Principal (Título Chamativo)</label>
                <input
                  type="text"
                  value={config.content?.heroHeadline || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, heroHeadline: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Subheadline (Explicação da Oferta)</label>
                <textarea
                  rows={2}
                  value={config.content?.heroSubheadline || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, heroSubheadline: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-400 mb-1.5">
                  🔥 Texto / Carta de Vendas Livre da Modelo (Multi-linhas completo — Aparece abaixo do player)
                </label>
                <textarea
                  rows={8}
                  value={config.content?.longDescription || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, longDescription: e.target.value },
                    })
                  }
                  placeholder="Escreva ou cole aqui qualquer texto livre, história ou copy da modelo com emojis, parágrafos, etc. Ele aparecerá formatado na landing page exatamente como você digitar!"
                  className="w-full bg-zinc-900 border border-brand-500/30 rounded-xl p-4 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* 2. Card de Compra & Botão CTA */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span>2. Card da Oferta & Botão de Pagamento</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Título da Oferta</label>
                  <input
                    type="text"
                    value={config.content?.cardOfferTitle || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        content: { ...config.content, cardOfferTitle: e.target.value },
                      })
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Texto do Botão CTA</label>
                  <input
                    type="text"
                    value={config.content?.ctaButtonText || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        content: { ...config.content, ctaButtonText: e.target.value },
                      })
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Subtítulo da Oferta</label>
                <input
                  type="text"
                  value={config.content?.cardOfferSubtitle || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, cardOfferSubtitle: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Microcopy Abaixo do Botão (Texto de Segurança)</label>
                <input
                  type="text"
                  value={config.content?.ctaMicrocopy || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, ctaMicrocopy: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* 3. Garantia de Reembolso 100% */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/20 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>3. Garantia Incondicional de 100% de Reembolso</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Título da Seção de Garantia</label>
                <input
                  type="text"
                  value={config.content?.guaranteeTitle || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, guaranteeTitle: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Texto Explicativo da Garantia (Copy de Alta Confiança)</label>
                <textarea
                  rows={3}
                  value={config.content?.guaranteeText || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      content: { ...config.content, guaranteeText: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>
            </div>

            {/* 4. Pilares / Benefícios da Oferta */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-500" />
                <span>4. Pilares de Benefícios da Landing ({config.content?.benefits?.length || 0})</span>
              </h3>

              <div className="space-y-3">
                {config.content?.benefits?.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Excluir benefício"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white">Adicionar Novo Benefício</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newBenefitTitle}
                    onChange={(e) => setNewBenefitTitle(e.target.value)}
                    placeholder="Título do Benefício"
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    value={newBenefitDesc}
                    onChange={(e) => setNewBenefitDesc(e.target.value)}
                    placeholder="Descrição do Benefício"
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  disabled={!newBenefitTitle.trim()}
                  className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir Benefício</span>
                </button>
              </div>
            </div>

            {/* 5. FAQ / Dúvidas Frequentes */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-500" />
                <span>5. Perguntas & Respostas Frequentes (FAQ) ({config.content?.faqs?.length || 0})</span>
              </h3>

              <div className="space-y-3">
                {config.content?.faqs?.map((faq, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white">{faq.question}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{faq.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Excluir pergunta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-white">Adicionar Nova Pergunta ao FAQ</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    placeholder="Pergunta (ex: Como recebo o link do WhatsApp?)"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <textarea
                    rows={2}
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    placeholder="Resposta clara e direta..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  disabled={!newFaqQuestion.trim()}
                  className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir Pergunta no FAQ</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Todas as Copies & Textos</span>
            </button>
          </form>
        )}

        {/* TAB 4: MURAL DE COMUNICADOS (ABAIXO DO VÍDEO) */}
        {activeTab === 'announcements' && (
          <div className="space-y-8 max-w-4xl animate-fade-in">
            {chatFeedback && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{chatFeedback}</span>
              </div>
            )}

            {/* Configurações de Exibição e Tempo do Mural */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>Configuração de Tempo & Transmissão dos Avisos</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
                  <label className="block text-xs font-bold text-white">
                    Intervalo Entre Cada Aviso (Segundos)
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    Tempo que o visitante espera para ver o próximo aviso subir na tela.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="number"
                      min={3}
                      max={120}
                      value={config?.announcementConfig?.intervalSeconds ?? 8}
                      onChange={(e) => {
                        if (!config) return;
                        setConfig({
                          ...config,
                          announcementConfig: {
                            ...config.announcementConfig,
                            intervalSeconds: Math.max(3, Number(e.target.value) || 8),
                          },
                        });
                      }}
                      className="w-24 bg-[#08080c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                    />
                    <span className="text-xs text-zinc-400 font-mono">segundos (padrão: 8s)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
                  <label className="block text-xs font-bold text-white">
                    Repetição Contínua (Loop)
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    Ao chegar no último comunicado, recomeça do início como stream contínuo.
                  </p>
                  <label className="flex items-center gap-3 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config?.announcementConfig?.loop ?? true}
                      onChange={(e) => {
                        if (!config) return;
                        setConfig({
                          ...config,
                          announcementConfig: {
                            ...config.announcementConfig,
                            loop: e.target.checked,
                          },
                        });
                      }}
                      className="w-4 h-4 rounded bg-zinc-900 border-white/20 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-zinc-200 font-semibold">Repetir mensagens em Loop infinito</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Configurações do Mural</span>
                </button>
              </div>
            </div>

            {/* Lista de Comunicados Ativos */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-500" />
                <span>Comunicados Oficiais no Mural ({announcements.length})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Essas mensagens aparecem na caixa <strong>"Mural de Comunicados"</strong> fixada logo abaixo do player de vídeo na página inicial.
              </p>

              <div className="space-y-2.5">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2.5 text-xs overflow-hidden">
                      <span className="font-bold text-white whitespace-nowrap">{ann.authorName}:</span>
                      <span className="text-zinc-300 truncate">"{ann.message}"</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors flex-shrink-0"
                      title="Excluir comunicado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form para Adicionar Novo Comunicado */}
              <form onSubmit={handleAddAnnouncement} className="pt-4 border-t border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white">Publicar Novo Comunicado Oficial</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newAnnAuthor}
                    onChange={(e) => setNewAnnAuthor(e.target.value)}
                    placeholder="Nome do Remetente (ex: Equipe de Produção, Sara)"
                    required
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    value={newAnnMessage}
                    onChange={(e) => setNewAnnMessage(e.target.value)}
                    placeholder="Texto do comunicado..."
                    required
                    className="sm:col-span-2 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-brand flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publicar no Mural</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: CHAT DA SALA VIP */}
        {activeTab === 'chat' && (
          <div className="space-y-8 max-w-4xl animate-fade-in">
            {chatFeedback && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{chatFeedback}</span>
              </div>
            )}

            {/* Injetor Manual Direto */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <span>Injetar Mensagem no Chat da Sala VIP (/live)</span>
                </h3>

                <button
                  type="button"
                  onClick={handleClearChatHistory}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Histórico do Chat</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Nome do Usuário</label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder="Ex: Rodrigo_SP"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Mensagem</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Ex: Imagem tá perfeita hoje Isabella!"
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleInjectCustomMessage(customAuthor, customText, customIsMod);
                        setCustomText('');
                      }}
                      disabled={!customText.trim()}
                      className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-brand flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={customIsMod}
                    onChange={(e) => setCustomIsMod(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-0"
                  />
                  <span>Enviar como <strong>STAFF / Modelo</strong></span>
                </label>
              </div>
            </div>

            {/* Banco de Templates */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-500" />
                <span>Mensagens Pré-Configuradas (1 Clique)</span>
              </h3>

              <div className="space-y-2.5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 text-xs overflow-hidden">
                      <span className={`font-bold ${tpl.isModerator ? 'text-brand-400' : 'text-zinc-200'}`}>
                        {tpl.authorName}:
                      </span>
                      <span className="text-zinc-300 truncate">"{tpl.text}"</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInjectCustomMessage(tpl.authorName, tpl.text, tpl.isModerator)}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-brand-500 hover:text-white text-zinc-300 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-brand-400" />
                        <span>Disparar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form para novo template */}
              <form onSubmit={handleAddNewTemplate} className="pt-3 border-t border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white">Criar Nova Mensagem</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newTplAuthor}
                    onChange={(e) => setNewTplAuthor(e.target.value)}
                    placeholder="Nome"
                    required
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    value={newTplText}
                    onChange={(e) => setNewTplText(e.target.value)}
                    placeholder="Mensagem..."
                    required
                    className="sm:col-span-2 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Salvar no Banco</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: MÉTRICAS & ANÁLISE SEPARADA POR PÁGINA */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-8 animate-fade-in max-w-5xl">
            {/* 1. SEÇÃO: LANDING PAGE PRINCIPAL */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    1. Landing Page Principal (Live R$ 9,90 • "/")
                  </h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Conversão da Oferta</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    Visitas na Home
                  </span>
                  <span className="text-2xl font-black text-white">
                    {metrics.homePage?.views ?? metrics.pageViews}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    Cliques no Botão ("Desbloquear")
                  </span>
                  <span className="text-2xl font-black text-white">
                    {metrics.homePage?.ctaClicks ?? metrics.ctaClicks}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    PIX Gerados
                  </span>
                  <span className="text-2xl font-black text-white">
                    {metrics.homePage?.checkoutsStarted ?? metrics.checkoutsStarted}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/25">
                  <span className="text-[11px] text-emerald-400 font-mono uppercase tracking-wider block mb-1">
                    Pagamentos Confirmados
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-400">
                      {metrics.homePage?.paymentsCompleted ?? metrics.paymentsCompleted}
                    </span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">
                      {metrics.homePage?.conversionRate ?? metrics.conversionRate}% taxa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SEÇÃO: PÁGINA DO WHATSAPP */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    2. Página de Atendimento do WhatsApp ("/whatsapp")
                  </h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">Funil do WhatsApp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    Visitas na Página /whatsapp
                  </span>
                  <span className="text-2xl font-black text-white">
                    {metrics.whatsappPage?.views ?? 0}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400 font-mono uppercase tracking-wider block mb-1">
                    Chamaram no WhatsApp
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-400">
                      {metrics.whatsappPage?.whatsappClicks ?? metrics.whatsappRedirects}
                    </span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">
                      {metrics.whatsappPage?.conversionRate ?? 0}% taxa
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Cliques no botão verde</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-300 font-mono uppercase tracking-wider block mb-1">
                    Entraram no Grupo de Prévias
                  </span>
                  <span className="text-2xl font-black text-zinc-200">
                    {metrics.whatsappPage?.previewsClicks ?? metrics.previewsGroupClicks}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">Cliques no Telegram / Canal</span>
                </div>
              </div>
            </div>

            {/* 3. SEÇÃO: SALA PRIVADA & TRÁFEGO GERAL */}
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    3. Sala Privada Ao Vivo ("/live") & Dispositivos
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    Entradas na Sala VIP (/live)
                  </span>
                  <span className="text-2xl font-black text-white">
                    {metrics.liveRoom?.liveEnters ?? metrics.liveEnters}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    Visitantes Online Agora
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {metrics.activeVisitorsNow}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5">
                  <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                    Tráfego Mobile
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    {metrics.deviceBreakdown.mobile + metrics.deviceBreakdown.desktop > 0
                      ? Math.round(
                          (metrics.deviceBreakdown.mobile /
                            (metrics.deviceBreakdown.mobile + metrics.deviceBreakdown.desktop || 1)) *
                            100
                        )
                      : 100}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PAGAMENTOS */}
        {activeTab === 'payments' && (
          <div className="space-y-4 animate-fade-in">
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#101010]">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 uppercase font-mono text-[10px] text-zinc-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="p-4">ID Transação</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Data Criação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-400">
                        Nenhum pagamento registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-zinc-200">{p.id}</td>
                        <td className="p-4 font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency }).format(p.amount)}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400 font-mono">
                          {new Date(p.createdAt).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: ACESSOS ATIVOS */}
        {activeTab === 'sessions' && (
          <div className="space-y-4 animate-fade-in">
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#101010]">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 uppercase font-mono text-[10px] text-zinc-400 border-b border-white/[0.08]">
                  <tr>
                    <th className="p-4">Sessão ID</th>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Expira em (30 Dias)</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-400">
                        Nenhuma sessão de acesso ativa no momento.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-zinc-200">{s.id}</td>
                        <td className="p-4 font-bold text-white">{s.displayName || 'VIP'}</td>
                        <td className="p-4 font-mono text-zinc-400">
                          {new Date(s.expiresAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[11px] font-semibold"
                          >
                            Revogar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: CONFIGURAÇÕES GERAIS */}
        {activeTab === 'settings' && config && (
          <div className="space-y-6 max-w-2xl animate-fade-in">
            <div className="p-6 rounded-2xl glass-card border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-brand-400">
                Status de Segurança & Anti-Bot
              </h3>

              <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Cloudflare Turnstile:</span>
                  <span className="font-mono text-emerald-400">Ativo (1x000...AA)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Preço Padrão da Oferta:</span>
                  <span className="font-mono text-white font-bold">R$ 9,90 (30 Dias + WhatsApp)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

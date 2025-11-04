import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, Vehicle, ServiceOrder } from './types';
import { initializeChat, sendMessage } from './services/geminiService';
import { getSupabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import ChatMessage from './components/ChatMessage';

type Page = 'dashboard' | 'vehicles' | 'schedule' | 'history';

// --- ICONS ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const MotorcycleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>;


// --- SHADCN/UI INSPIRED COMPONENTS ---
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <input
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-dark-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
    />
));

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }> = ({ children, className, ...props }) => (
    <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-brand-dark-blue text-white hover:bg-blue-800/90 h-10 px-4 py-2 w-full ${className}`}
        {...props}
    >
        {children}
    </button>
);

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement> & { children: React.ReactNode }> = ({ children, className, ...props }) => (
    <label className={`text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-800 ${className}`} {...props}>
        {children}
    </label>
);

const AuthCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-white rounded-xl border bg-card text-card-foreground shadow-lg ${className}`}>
        {children}
    </div>
);

const AuthCardHeader: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div className="flex flex-col space-y-1.5 p-6 text-center">
        <h3 className="text-2xl font-bold font-title tracking-tight text-brand-dark-blue">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
    </div>
);

const AuthCardContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const AuthCardFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
);


// --- CHAT WIDGET ---
const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      const success = initializeChat();
      if (success) {
        setMessages([
          {
            id: 'initial-bot-message',
            role: 'model',
            text: "Olá! Eu sou o MotoBot. Como posso ajudar com o sistema da oficina?",
          },
        ]);
      } else {
        setMessages([
          {
            id: 'init-error-message',
            role: 'model',
            text: "Desculpe, não foi possível conectar ao assistente de IA. Verifique as configurações.",
          },
        ]);
      }
      isInitialized.current = true;
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(trimmedInput);
      const botMessage: Message = { id: `model-${Date.now()}`, role: 'model', text: response.text };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = { id: `error-${Date.now()}`, role: 'model', text: "Desculpe, ocorreu um erro. Tente novamente." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);
  
  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-brand-dark-blue text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-blue z-50">
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      <header className="bg-brand-dark-blue text-white p-3 flex justify-between items-center rounded-t-lg">
        <h3 className="font-bold font-title">Assistente MotoBot</h3>
        <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-full"><CloseIcon /></button>
      </header>
      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto bg-brand-light-gray">
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
         {isLoading && (
            <div className="flex items-start gap-3 my-4 justify-start">
               <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-dark-blue" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 8.89c0-3.23-2.63-5.86-5.86-5.86s-5.86 2.63-5.86 5.86c0 1.25.4 2.4 1.08 3.34-1.42.4-2.85.86-4.22 1.48-.68 1.63-1.07 3.42-1.07 5.29H2c-1.1 0-2 .9-2 2v2h2v-2h2.06c.01-.01 0 0 0 0 .1-.63.29-1.24.54-1.81.33-.74.75-1.42 1.24-2.03.6-.72 1.3-1.35 2.08-1.87 1.43-.94 3.09-1.57 4.9-1.87.68.96 1.62 1.76 2.76 2.22 1.13.46 2.36.6 3.63.4 1.27-.2 2.44-.7 3.45-1.45.28-.2.54-.42.79-.65.25-.23.49-.47.71-.72.63-.73 1.13-1.59 1.46-2.54.34-.94.52-1.95.52-3.02zm-5.86 3.14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM20 18h2v2h-2zM4 14.12C4.01 14.07 4 14.02 4 14c0-.79.13-1.54.38-2.25.25-.71.6-1.37 1.04-1.96.44-.59.97-1.11 1.58-1.54 1.76-1.25 3.86-2.03 6.09-2.24.03.18.06.36.08.54.02.18.04.37.04.56 0 2.29-1.04 4.35-2.71 5.67-1.11.88-2.45 1.45-3.89 1.64C5.7 15.69 4.67 14.99 4 14.12z" /></svg>
               </div>
              <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-none shadow-sm"><div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div><div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div><div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div></div></div>
            </div>
          )}
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t flex items-center space-x-2">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Digite sua mensagem..." className="w-full px-3 py-2 border rounded-full focus:outline-none focus:ring-1 focus:ring-brand-dark-blue" disabled={isLoading} />
        <button type="submit" disabled={isLoading || !inputValue.trim()} className="bg-brand-dark-blue text-white rounded-full p-2 hover:bg-blue-800 disabled:bg-gray-400"><SendIcon/></button>
      </form>
    </div>
  );
};


// --- AUTH PAGES ---
const AuthPageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center bg-brand-light-gray px-4">
        {children}
    </div>
);

const LoginPage: React.FC<{ onSwitchToRegister: () => void; }> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };
  
  return (
    <AuthPageContainer>
      <AuthCard className="w-full max-w-sm">
        <AuthCardHeader title="Bem-vindo de volta!" description="Acesse o portal do cliente para continuar." />
        <form onSubmit={handleSubmit}>
          <AuthCardContent className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="cliente@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
            </div>
          </AuthCardContent>
          <AuthCardFooter className="flex-col space-y-4">
            <Button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <button type="button" onClick={onSwitchToRegister} className="font-semibold text-brand-dark-blue hover:underline focus:outline-none">
                Cadastre-se
              </button>
            </p>
          </AuthCardFooter>
        </form>
      </AuthCard>
    </AuthPageContainer>
  );
};

const RegistrationPage: React.FC<{ onSwitchToLogin: () => void; }> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setLoading(true);
        const supabase = getSupabase();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
            onSwitchToLogin();
        }
        setLoading(false);
    };

    return (
        <AuthPageContainer>
            <AuthCard className="w-full max-w-sm">
                <AuthCardHeader title="Crie sua conta" description="É rápido e fácil. Comece agora." />
                <form onSubmit={handleSubmit}>
                    <AuthCardContent className="space-y-4">
                        {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" type="text" placeholder="João da Silva" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-register">Email</Label>
                            <Input id="email-register" type="email" placeholder="joao.silva@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-register">Senha</Label>
                            <Input id="password-register" type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
                        </div>
                    </AuthCardContent>
                    <AuthCardFooter className="flex-col space-y-4">
                        <Button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar Conta'}</Button>
                         <p className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-dark-blue hover:underline focus:outline-none">
                                Faça o login
                            </button>
                        </p>
                    </AuthCardFooter>
                </form>
            </AuthCard>
        </AuthPageContainer>
    );
};


// --- APP LAYOUT & PAGES ---
const Navbar: React.FC<{ setPage: (page: Page) => void; onLogout: () => void; activePage: Page }> = ({ setPage, onLogout, activePage }) => {
  const navItems = [
    { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { id: 'vehicles', icon: <MotorcycleIcon />, label: 'Meus Veículos' },
    { id: 'schedule', icon: <CalendarIcon />, label: 'Agendar Serviço' },
    { id: 'history', icon: <HistoryIcon />, label: 'Histórico' },
  ];

  return (
    <nav className="w-64 bg-brand-dark-blue text-white flex flex-col p-4 shadow-lg">
      <h1 className="text-2xl font-bold font-title text-center mb-10 mt-4">MotoWorkshop</h1>
      <ul className="flex flex-col gap-2 flex-grow">
        {navItems.map(item => (
          <li key={item.id}>
            <button onClick={() => setPage(item.id as Page)} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-blue-900' : 'hover:bg-blue-800'}`}>
              {item.icon}
              <span className="font-semibold">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors">
        <LogoutIcon />
        <span className="font-semibold">Sair</span>
      </button>
    </nav>
  );
};

const PageHeader: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
        <div>{children}</div>
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>{children}</div>
);

const DashboardPage: React.FC<{ user: User; vehicles: Vehicle[]; services: ServiceOrder[]; setPage: (page: Page) => void; }> = ({ user, vehicles, services, setPage }) => {
    const upcomingServices = services.filter(s => s.status === 'Scheduled');
    const userName = user.user_metadata?.full_name || user.email;
    return (
        <div>
            <PageHeader title={`Bem-vindo, ${userName}!`}/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <h3 className="font-bold text-lg mb-4">Próximos Agendamentos</h3>
                    {upcomingServices.length > 0 ? (
                      <ul className="space-y-3">
                        {upcomingServices.map(s => <li key={s.id} className="p-3 bg-gray-50 rounded-md">{s.service_date} - {s.services.join(', ')}</li>)}
                      </ul>
                    ) : (
                      <p className="text-gray-600">Nenhum serviço agendado.</p>
                    )}
                    <button onClick={() => setPage('schedule')} className="mt-4 bg-brand-dark-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors">Agendar Novo Serviço</button>
                </Card>
                 <Card>
                    <h3 className="font-bold text-lg mb-4">Seus Veículos</h3>
                    <p className="text-5xl font-bold text-brand-dark-blue mb-2">{vehicles.length}</p>
                    <p className="text-gray-600 mb-4">veículos cadastrados</p>
                    <button onClick={() => setPage('vehicles')} className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Gerenciar Veículos</button>
                </Card>
            </div>
        </div>
    );
};

const MyVehiclesPage: React.FC<{ vehicles: Vehicle[]; onAddVehicle: (v: Omit<Vehicle, 'id' | 'user_id'>) => void }> = ({ vehicles, onAddVehicle }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: new Date().getFullYear(), license_plate: '' });

    const handleSave = () => {
        if (!newVehicle.make || !newVehicle.model || !newVehicle.license_plate) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        onAddVehicle(newVehicle);
        setIsAdding(false);
        setNewVehicle({ make: '', model: '', year: new Date().getFullYear(), license_plate: '' });
    }

    return (
        <div>
            <PageHeader title="Meus Veículos">
                {!isAdding && <button onClick={() => setIsAdding(true)} className="bg-brand-dark-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors">Adicionar Veículo</button>}
            </PageHeader>
            {isAdding && (
                <Card className="mb-6">
                    <h3 className="font-bold text-lg mb-4">Novo Veículo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={newVehicle.make} onChange={e => setNewVehicle(v => ({...v, make: e.target.value}))} placeholder="Marca (ex: Honda)" className="w-full p-2 border rounded"/>
                        <input value={newVehicle.model} onChange={e => setNewVehicle(v => ({...v, model: e.target.value}))} placeholder="Modelo (ex: CB 300R)" className="w-full p-2 border rounded"/>
                        <input value={newVehicle.year} onChange={e => setNewVehicle(v => ({...v, year: parseInt(e.target.value)}))} type="number" placeholder="Ano" className="w-full p-2 border rounded"/>
                        <input value={newVehicle.license_plate} onChange={e => setNewVehicle(v => ({...v, license_plate: e.target.value}))} placeholder="Placa" className="w-full p-2 border rounded"/>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleSave} className="bg-brand-dark-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800">Salvar</button>
                        <button onClick={() => setIsAdding(false)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancelar</button>
                    </div>
                </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(v => (
                    <Card key={v.id}>
                        <h3 className="font-bold text-lg">{v.make} {v.model}</h3>
                        <p className="text-gray-600">{v.year}</p>
                        <p className="mt-2 text-sm font-mono bg-gray-100 inline-block px-2 py-1 rounded">{v.license_plate}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const ScheduleServicePage: React.FC<{ vehicles: Vehicle[]; onSubmit: (s: Omit<ServiceOrder, 'id'|'user_id'|'status'>) => void }> = ({ vehicles, onSubmit }) => {
    const [formState, setFormState] = useState({ vehicle_id: '', services: [] as string[], service_date: '', notes: '' });

    const handleServiceToggle = (service: string) => {
        setFormState(s => s.services.includes(service) 
            ? {...s, services: s.services.filter(x => x !== service)} 
            : {...s, services: [...s.services, service]}
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.vehicle_id || formState.services.length === 0 || !formState.service_date) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        onSubmit(formState);
        alert('Serviço agendado com sucesso!');
        setFormState({ vehicle_id: '', services: [], service_date: '', notes: '' });
    }
    
    const availableServices = ['Troca de óleo', 'Revisão Completa', 'Troca de Pneus', 'Freios', 'Elétrica', 'Suspensão'];

    return (
        <div>
            <PageHeader title="Agendar Novo Serviço" />
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="font-bold">1. Selecione o Veículo</label>
                        <select value={formState.vehicle_id} onChange={e => setFormState(s => ({...s, vehicle_id: e.target.value}))} required className="mt-2 block w-full p-2 border rounded">
                            <option value="" disabled>Selecione...</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-bold">2. Escolha os Serviços</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableServices.map(service => (
                                <button type="button" key={service} onClick={() => handleServiceToggle(service)} className={`p-4 border rounded-lg text-center font-semibold transition-colors ${formState.services.includes(service) ? 'bg-brand-dark-blue text-white border-brand-dark-blue' : 'hover:border-gray-400'}`}>
                                    {service}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-bold" htmlFor="date">3. Escolha a Data</label>
                        <input id="date" type="date" value={formState.service_date} onChange={e => setFormState(s => ({...s, service_date: e.target.value}))} required className="mt-2 block w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="font-bold" htmlFor="notes">4. Observações Adicionais</label>
                        <textarea id="notes" value={formState.notes} onChange={e => setFormState(s => ({...s, notes: e.target.value}))} rows={4} className="mt-2 block w-full p-2 border rounded" placeholder="Alguma informação extra para os mecânicos?"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-brand-dark-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors text-lg">Confirmar Agendamento</button>
                </form>
            </Card>
        </div>
    );
};

const ServiceHistoryPage: React.FC<{ services: ServiceOrder[]; vehicles: Vehicle[] }> = ({ services, vehicles }) => {
    const getVehicleInfo = (id: string) => vehicles.find(v => v.id === id);
    const getStatusClass = (status: ServiceOrder['status']) => {
        if (status === 'Completed') return 'bg-green-100 text-green-800';
        if (status === 'In Progress') return 'bg-yellow-100 text-yellow-800';
        return 'bg-blue-100 text-blue-800';
    }

    return (
        <div>
            <PageHeader title="Histórico de Serviços" />
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-4">Data</th>
                                <th className="p-4">Veículo</th>
                                <th className="p-4">Serviços</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(s => (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{s.service_date}</td>
                                    <td className="p-4">{getVehicleInfo(s.vehicle_id)?.make} {getVehicleInfo(s.vehicle_id)?.model}</td>
                                    <td className="p-4">{s.services.join(', ')}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusClass(s.status)}`}>{s.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching session:", error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const fetchUserData = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const supabase = getSupabase();
      const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', session.user.id);

      if (vehiclesError) console.error("Error fetching vehicles:", vehiclesError);
      else setVehicles(vehiclesData || []);

      const { data: servicesData, error: servicesError } = await supabase
          .from('service_orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('service_date', { ascending: false });
          
      if (servicesError) console.error("Error fetching services:", servicesError);
      else setServices(servicesData || []);
    } catch (error) {
      console.error("An unexpected error occurred while fetching user data:", error);
    }

  }, [session]);

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session, fetchUserData]);


  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setVehicles([]);
    setServices([]);
    setPage('dashboard');
  };
  
  const handleAddVehicle = async (v: Omit<Vehicle, 'id'|'user_id'>) => {
    if (!session?.user) return;
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('vehicles')
            .insert([{ ...v, user_id: session.user.id }])
            .select();

        if (error) {
            alert('Erro ao adicionar veículo: ' + error.message);
        } else if (data) {
            setVehicles(current => [...current, ...data]);
        }
    } catch (e) {
        console.error('Unexpected error adding vehicle:', e);
        alert('Ocorreu um erro inesperado ao adicionar o veículo.');
    }
  };
  
  const handleScheduleService = async (s: Omit<ServiceOrder, 'id'|'user_id'|'status'>) => {
    if (!session?.user) return;
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('service_orders')
            .insert([{ ...s, user_id: session.user.id, status: 'Scheduled' }])
            .select();

        if (error) {
            alert('Erro ao agendar serviço: ' + error.message);
        } else if (data) {
            setServices(current => [...data, ...current].sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()));
            setPage('history');
        }
    } catch (e) {
        console.error('Unexpected error scheduling service:', e);
        alert('Ocorreu um erro inesperado ao agendar o serviço.');
    }
  }

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    if (authPage === 'register') {
        return <RegistrationPage onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />;
  }
  
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage user={session.user} vehicles={vehicles} services={services} setPage={setPage} />;
      case 'vehicles':
        return <MyVehiclesPage vehicles={vehicles} onAddVehicle={handleAddVehicle}/>;
      case 'schedule':
        return <ScheduleServicePage vehicles={vehicles} onSubmit={handleScheduleService} />;
      case 'history':
        return <ServiceHistoryPage services={services} vehicles={vehicles} />;
      default:
        return <DashboardPage user={session.user} vehicles={vehicles} services={services} setPage={setPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-light-gray font-sans">
      <Navbar setPage={setPage} onLogout={handleLogout} activePage={page} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderPage()}
      </main>
      <ChatWidget />
    </div>
  );
};

export default App;